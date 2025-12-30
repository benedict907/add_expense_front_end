#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🧪 Testing Expense Tracker Full Stack Setup...\n');

async function testBackend() {
  console.log('1. Testing Backend API...');
  try {
    const { stdout, stderr } = await execAsync('cd backend && npm test');
    if (stderr) {
      console.log('⚠️  Backend test warnings:', stderr);
    }
    console.log('✅ Backend API is working');
    return true;
  } catch (error) {
    console.log('❌ Backend test failed:', error.message);
    console.log('💡 Make sure to:');
    console.log('   - Install backend dependencies: cd backend && npm install');
    console.log('   - Start MongoDB: mongod');
    console.log('   - Start backend: cd backend && npm run dev');
    return false;
  }
}

async function testFrontend() {
  console.log('\n2. Testing Frontend...');
  try {
    const { stdout, stderr } = await execAsync('npm run build');
    if (stderr) {
      console.log('⚠️  Frontend build warnings:', stderr);
    }
    console.log('✅ Frontend builds successfully');
    return true;
  } catch (error) {
    console.log('❌ Frontend test failed:', error.message);
    console.log('💡 Make sure to:');
    console.log('   - Install frontend dependencies: npm install');
    console.log('   - Check for TypeScript/ESLint errors');
    return false;
  }
}

async function checkDependencies() {
  console.log('\n3. Checking Dependencies...');
  
  try {
    // Check if backend dependencies are installed
    const { stdout: backendDeps } = await execAsync('cd backend && npm list --depth=0');
    if (backendDeps.includes('express')) {
      console.log('✅ Backend dependencies installed');
    } else {
      console.log('❌ Backend dependencies missing');
      return false;
    }

    // Check if frontend dependencies are installed
    const { stdout: frontendDeps } = await execAsync('npm list --depth=0');
    if (frontendDeps.includes('react')) {
      console.log('✅ Frontend dependencies installed');
    } else {
      console.log('❌ Frontend dependencies missing');
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ Dependency check failed:', error.message);
    return false;
  }
}

async function main() {
  const depsOk = await checkDependencies();
  if (!depsOk) {
    console.log('\n💡 Run the setup commands first:');
    console.log('   cd backend && npm install');
    console.log('   cd .. && npm install');
    return;
  }

  const backendOk = await testBackend();
  const frontendOk = await testFrontend();

  console.log('\n📊 Test Results:');
  console.log(`   Backend: ${backendOk ? '✅' : '❌'}`);
  console.log(`   Frontend: ${frontendOk ? '✅' : '❌'}`);

  if (backendOk && frontendOk) {
    console.log('\n🎉 All tests passed! Your setup is ready.');
    console.log('\n🚀 To start the application:');
    console.log('   1. Start backend: cd backend && npm run dev');
    console.log('   2. Start frontend: npm run dev');
    console.log('   3. Open http://localhost:5173 in your browser');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  }
}

main().catch(console.error);
