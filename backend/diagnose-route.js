console.log('🔍 Diagnosing route issue...\n');

// 1. Check middleware
try {
  const auth = require('./middleware/auth');
  console.log('✅ middleware/auth.js loaded:', typeof auth.auth === 'function' ? 'YES' : 'NO');
} catch (e) {
  console.log('❌ middleware/auth.js error:', e.message);
}

// 2. Check vehicle controller
console.log('\n📋 Checking vehicleController.js:');
try {
  const vehicleController = require('./controllers/vehicleController');
  console.log('   Loaded successfully:', vehicleController ? 'YES' : 'NO');
  
  const functions = Object.keys(vehicleController).filter(k => typeof vehicleController[k] === 'function');
  console.log('   Exported functions:', functions.length > 0 ? functions.join(', ') : 'NONE');
  
  // Check specific functions
  const requiredFuncs = ['getAllVehicles', 'getVehicle', 'createVehicle', 'updateVehicle', 'deleteVehicle'];
  for (const func of requiredFuncs) {
    console.log(`   ${func}:`, typeof vehicleController[func] === 'function' ? '✅' : '❌ MISSING');
  }
  
} catch (e) {
  console.log('   ❌ Error loading controller:', e.message);
}

// 3. Check routes file
console.log('\n🚦 Checking routes/vehicles.js imports:');
try {
  // Simulate what routes/vehicles.js does
  const vehicleController = require('./controllers/vehicleController');
  console.log('   getAllVehicles exists:', typeof vehicleController.getAllVehicles === 'function' ? '✅' : '❌');
  
  if (typeof vehicleController.getAllVehicles !== 'function') {
    console.log('   🔍 Checking what IS exported:', Object.keys(vehicleController));
  }
} catch (e) {
  console.log('   ❌ Error:', e.message);
}

console.log('\n🎯 Most likely issue:');
console.log('1. vehicleController.js might not export functions correctly');
console.log('2. Circular dependency issue');
console.log('3. Syntax error in vehicleController.js');
