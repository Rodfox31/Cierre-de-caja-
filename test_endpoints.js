const axios = require('axios');

async function testEndpoints() {
  const baseUrl = 'http://localhost:3001';
  const cierreId = 72; // ID de prueba
  
  console.log('=== Probando Endpoints de Validación ===\n');
  
  try {
    // Test 1: Revisar Boutique (validado = 2)
    console.log(`1. Probando: PUT ${baseUrl}/api/cierres-completo/${cierreId}/revisar`);
    const res1 = await axios.put(`${baseUrl}/api/cierres-completo/${cierreId}/revisar`, {
      usuario_validacion: 'admin'
    });
    console.log('   ✅ Respuesta:', res1.data);
    console.log('   Status:', res1.status);
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 2: Validar (validado = 1)
    console.log(`\n2. Probando: PUT ${baseUrl}/api/cierres-completo/${cierreId}/validar`);
    const res2 = await axios.put(`${baseUrl}/api/cierres-completo/${cierreId}/validar`, {
      usuario_validacion: 'admin'
    });
    console.log('   ✅ Respuesta:', res2.data);
    console.log('   Status:', res2.status);
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 3: Desvalidar (validado = 0)
    console.log(`\n3. Probando: PUT ${baseUrl}/api/cierres-completo/${cierreId}/desvalidar`);
    const res3 = await axios.put(`${baseUrl}/api/cierres-completo/${cierreId}/desvalidar`);
    console.log('   ✅ Respuesta:', res3.data);
    console.log('   Status:', res3.status);
    
    console.log('\n=== ✅ Todos los endpoints funcionan correctamente ===');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testEndpoints();
