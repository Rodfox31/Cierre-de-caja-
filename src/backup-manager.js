/**
 * BACKUP MANAGER - Sistema de Respaldos Automáticos
 * Gestiona respaldos automáticos de la base de datos SQLite
 * Características:
 * - Respaldos programados (diarios)
 * - Exportación a CSV mensual
 * - Limpieza automática de archivos antiguos
 * - Restauración desde respaldos
 */

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');

class BackupManager {
    constructor(dbPath, backupDir = null) {
        this.dbPath = dbPath;
        this.backupDir = backupDir || path.resolve(path.dirname(dbPath), 'backups');
        this.logFile = path.join(this.backupDir, 'backup-log.txt');
        
        // Crear directorio de respaldos si no existe
        this.ensureBackupDirectory();
        
        // Log inicial
        this.log('BackupManager inicializado correctamente');
    }

    /**
     * Asegurar que el directorio de respaldos existe
     */
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            this.log(`Directorio de respaldos creado: ${this.backupDir}`);
        }
    }

    /**
     * Sistema de logging
     */
    log(message, isError = false) {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        const logMessage = `[${timestamp}] ${isError ? 'ERROR: ' : ''}${message}\n`;
        
        console.log(logMessage.trim());
        
        try {
            fs.appendFileSync(this.logFile, logMessage);
        } catch (err) {
            console.error('Error escribiendo en log:', err);
        }
    }

    /**
     * Crear respaldo completo de la base de datos
     */
    async createBackup() {
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const backupFileName = `cierre-caja-backup_${timestamp}.db`;
        const backupPath = path.join(this.backupDir, backupFileName);
        
        return new Promise((resolve, reject) => {
            // Verificar que la DB origen existe
            if (!fs.existsSync(this.dbPath)) {
                const error = `Base de datos no encontrada: ${this.dbPath}`;
                this.log(error, true);
                reject(new Error(error));
                return;
            }

            // Copiar archivo
            fs.copyFile(this.dbPath, backupPath, (err) => {
                if (err) {
                    this.log(`Error creando respaldo: ${err.message}`, true);
                    reject(err);
                } else {
                    const stats = fs.statSync(backupPath);
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                    this.log(`✓ Respaldo creado exitosamente: ${backupFileName} (${sizeMB} MB)`);
                    
                    // Limpiar respaldos antiguos después de crear uno nuevo
                    this.cleanOldBackups();
                    
                    resolve({
                        path: backupPath,
                        fileName: backupFileName,
                        size: stats.size,
                        timestamp: timestamp
                    });
                }
            });
        });
    }

    /**
     * Limpiar respaldos antiguos (mantener últimos 30 días + 1 por mes del último año)
     */
    cleanOldBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('cierre-caja-backup_') && file.endsWith('.db'));
            
            const cutoffDate = moment().subtract(30, 'days');
            const monthlyBackups = new Map(); // Para guardar 1 backup por mes
            let deletedCount = 0;

            files.forEach(file => {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                const fileDate = moment(stats.mtime);
                
                // Si el archivo es de los últimos 30 días, mantenerlo
                if (fileDate.isAfter(cutoffDate)) {
                    return;
                }
                
                // Para archivos más antiguos, mantener solo 1 por mes
                const monthKey = fileDate.format('YYYY-MM');
                
                if (!monthlyBackups.has(monthKey)) {
                    // Primer backup de este mes, guardarlo
                    monthlyBackups.set(monthKey, { file, date: fileDate });
                } else {
                    // Ya tenemos un backup de este mes
                    const existing = monthlyBackups.get(monthKey);
                    
                    // Mantener el más reciente del mes
                    if (fileDate.isAfter(existing.date)) {
                        // Este es más reciente, eliminar el anterior
                        const oldPath = path.join(this.backupDir, existing.file);
                        fs.unlinkSync(oldPath);
                        deletedCount++;
                        monthlyBackups.set(monthKey, { file, date: fileDate });
                    } else {
                        // El existente es más reciente, eliminar este
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    }
                }
            });

            if (deletedCount > 0) {
                this.log(`✗ ${deletedCount} respaldo(s) antiguo(s) eliminado(s)`);
            }
        } catch (err) {
            this.log(`Error limpiando respaldos antiguos: ${err.message}`, true);
        }
    }

    /**
     * Exportar cierres a CSV para un mes específico
     */
    async exportToCSV(month, year) {
        const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY);
        const outputFileName = `cierres_${year}-${month.toString().padStart(2, '0')}.csv`;
        const outputPath = path.join(this.backupDir, outputFileName);
        
        return new Promise((resolve, reject) => {
            const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
            
            db.all(`
                SELECT * FROM cierres 
                WHERE strftime('%Y-%m', fecha) = ?
                ORDER BY fecha DESC, tienda, usuario
            `, [monthStr], (err, rows) => {
                if (err) {
                    this.log(`Error exportando a CSV: ${err.message}`, true);
                    db.close();
                    reject(err);
                    return;
                }
                
                if (rows.length === 0) {
                    this.log(`No hay datos para exportar en ${monthStr}`);
                    db.close();
                    resolve(null);
                    return;
                }
                
                try {
                    // Obtener headers
                    const headers = Object.keys(rows[0]).join(',');
                    
                    // Convertir filas a CSV (escapar comillas y saltos de línea)
                    const csvRows = rows.map(row => 
                        Object.values(row).map(value => {
                            if (value === null || value === undefined) return '';
                            const str = String(value);
                            // Escapar comillas dobles y envolver en comillas si contiene coma, comilla o salto de línea
                            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                                return `"${str.replace(/"/g, '""')}"`;
                            }
                            return str;
                        }).join(',')
                    );
                    
                    const csv = [headers, ...csvRows].join('\n');
                    
                    // Guardar archivo
                    fs.writeFileSync(outputPath, csv, 'utf8');
                    
                    const stats = fs.statSync(outputPath);
                    const sizeKB = (stats.size / 1024).toFixed(2);
                    this.log(`✓ CSV exportado: ${outputFileName} (${rows.length} registros, ${sizeKB} KB)`);
                    
                    db.close();
                    resolve({
                        path: outputPath,
                        fileName: outputFileName,
                        recordCount: rows.length,
                        size: stats.size
                    });
                } catch (error) {
                    this.log(`Error creando archivo CSV: ${error.message}`, true);
                    db.close();
                    reject(error);
                }
            });
        });
    }

    /**
     * Restaurar base de datos desde un respaldo
     */
    async restoreFromBackup(backupPath) {
        return new Promise((resolve, reject) => {
            // Validar que el archivo de respaldo existe
            if (!fs.existsSync(backupPath)) {
                const error = `Archivo de respaldo no encontrado: ${backupPath}`;
                this.log(error, true);
                reject(new Error(error));
                return;
            }

            try {
                // Crear respaldo de emergencia antes de restaurar
                const emergencyBackupPath = this.dbPath + '.before-restore-' + moment().format('YYYY-MM-DD_HH-mm-ss');
                fs.copyFileSync(this.dbPath, emergencyBackupPath);
                this.log(`Respaldo de emergencia creado: ${emergencyBackupPath}`);

                // Restaurar desde el respaldo
                fs.copyFileSync(backupPath, this.dbPath);
                
                this.log(`✓ Base de datos restaurada exitosamente desde: ${path.basename(backupPath)}`);
                this.log(`  Respaldo de emergencia guardado en: ${emergencyBackupPath}`);
                
                resolve({
                    restored: true,
                    backupUsed: backupPath,
                    emergencyBackup: emergencyBackupPath
                });
            } catch (err) {
                this.log(`Error durante la restauración: ${err.message}`, true);
                reject(err);
            }
        });
    }

    /**
     * Listar todos los respaldos disponibles
     */
    listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('cierre-caja-backup_') && file.endsWith('.db'));
            
            const backups = files.map(file => {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                
                return {
                    fileName: file,
                    path: filePath,
                    size: stats.size,
                    created: moment(stats.mtime).format('YYYY-MM-DD HH:mm:ss'),
                    ageInDays: moment().diff(moment(stats.mtime), 'days')
                };
            });
            
            // Ordenar por fecha de creación (más reciente primero)
            backups.sort((a, b) => b.created.localeCompare(a.created));
            
            return backups;
        } catch (err) {
            this.log(`Error listando respaldos: ${err.message}`, true);
            return [];
        }
    }

    /**
     * Obtener estadísticas de respaldos
     */
    getBackupStats() {
        const backups = this.listBackups();
        
        if (backups.length === 0) {
            return {
                totalBackups: 0,
                totalSize: 0,
                oldestBackup: null,
                newestBackup: null
            };
        }

        const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
        
        return {
            totalBackups: backups.length,
            totalSize: totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            oldestBackup: backups[backups.length - 1],
            newestBackup: backups[0]
        };
    }

    /**
     * Programar respaldos automáticos
     */
    scheduleAutoBackups() {
        // Respaldo diario a las 2:00 AM
        cron.schedule('0 2 * * *', () => {
            this.log('=== Iniciando respaldo automático diario ===');
            this.createBackup()
                .then(result => {
                    this.log(`Respaldo automático completado: ${result.fileName}`);
                })
                .catch(err => {
                    this.log(`Respaldo automático falló: ${err.message}`, true);
                });
        });

        // Exportación CSV mensual el día 1 a las 3:00 AM
        cron.schedule('0 3 1 * *', () => {
            const lastMonth = moment().subtract(1, 'month');
            this.log(`=== Iniciando exportación CSV mensual para ${lastMonth.format('YYYY-MM')} ===`);
            
            this.exportToCSV(lastMonth.month() + 1, lastMonth.year())
                .then(result => {
                    if (result) {
                        this.log(`Exportación CSV completada: ${result.fileName}`);
                    }
                })
                .catch(err => {
                    this.log(`Exportación CSV falló: ${err.message}`, true);
                });
        });

        this.log('✓ Respaldos automáticos programados:');
        this.log('  - Respaldo diario: 2:00 AM');
        this.log('  - Exportación CSV mensual: Día 1 a las 3:00 AM');
    }

    /**
     * Verificar integridad de un respaldo
     */
    async verifyBackup(backupPath) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    this.log(`Error verificando respaldo: ${err.message}`, true);
                    reject(err);
                    return;
                }

                // Intentar hacer una query simple
                db.get('SELECT COUNT(*) as count FROM cierres', [], (err, row) => {
                    if (err) {
                        this.log(`Respaldo corrupto: ${err.message}`, true);
                        db.close();
                        reject(err);
                        return;
                    }

                    this.log(`✓ Respaldo verificado: ${row.count} registros encontrados`);
                    db.close();
                    resolve({
                        valid: true,
                        recordCount: row.count
                    });
                });
            });
        });
    }
}

module.exports = BackupManager;
