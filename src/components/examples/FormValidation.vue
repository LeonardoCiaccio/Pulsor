<template>
  <div class="p-8 bg-gradient-to-br from-rose-50 to-pink-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-rose-800 mb-4">✅ Form Validation</h1>
      <p class="text-lg text-rose-600 mb-6">
        Experience Pulsor's powerful form validation system with real-time validation, custom rules, and comprehensive error handling.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Registration Form -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📝 User Registration Form</h2>
        
        <form @submit.prevent="submitForm" class="space-y-4">
          <!-- Username Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input 
              v-model="formData.username" 
              @input="validateField('username')"
              @blur="validateField('username')"
              type="text" 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
              :class="getFieldClass('username')"
              placeholder="Enter username (min 3 chars)"
            >
            <div v-if="fieldErrors.username" class="text-red-600 text-xs mt-1">
              {{ fieldErrors.username }}
            </div>
            <div v-if="fieldSuccess.username" class="text-green-600 text-xs mt-1">
              ✓ Username is available
            </div>
          </div>

          <!-- Email Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input 
              v-model="formData.email" 
              @input="validateField('email')"
              @blur="validateField('email')"
              type="email" 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
              :class="getFieldClass('email')"
              placeholder="Enter valid email address"
            >
            <div v-if="fieldErrors.email" class="text-red-600 text-xs mt-1">
              {{ fieldErrors.email }}
            </div>
            <div v-if="fieldSuccess.email" class="text-green-600 text-xs mt-1">
              ✓ Valid email format
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input 
              v-model="formData.password" 
              @input="validateField('password')"
              @blur="validateField('password')"
              type="password" 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
              :class="getFieldClass('password')"
              placeholder="Enter strong password"
            >
            <div v-if="fieldErrors.password" class="text-red-600 text-xs mt-1">
              {{ fieldErrors.password }}
            </div>
            <div v-if="formData.password && !fieldErrors.password" class="text-xs mt-1">
              <div class="flex space-x-1">
                <div class="flex-1 h-1 rounded" :class="passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200'"></div>
                <div class="flex-1 h-1 rounded" :class="passwordStrength >= 2 ? 'bg-orange-500' : 'bg-gray-200'"></div>
                <div class="flex-1 h-1 rounded" :class="passwordStrength >= 3 ? 'bg-yellow-500' : 'bg-gray-200'"></div>
                <div class="flex-1 h-1 rounded" :class="passwordStrength >= 4 ? 'bg-green-500' : 'bg-gray-200'"></div>
              </div>
              <div class="text-gray-600 text-xs mt-1">{{ getPasswordStrengthText() }}</div>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input 
              v-model="formData.confirmPassword" 
              @input="validateField('confirmPassword')"
              @blur="validateField('confirmPassword')"
              type="password" 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
              :class="getFieldClass('confirmPassword')"
              placeholder="Confirm your password"
            >
            <div v-if="fieldErrors.confirmPassword" class="text-red-600 text-xs mt-1">
              {{ fieldErrors.confirmPassword }}
            </div>
            <div v-if="fieldSuccess.confirmPassword" class="text-green-600 text-xs mt-1">
              ✓ Passwords match
            </div>
          </div>

          <!-- Age Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Age *</label>
            <input 
              v-model.number="formData.age" 
              @input="validateField('age')"
              @blur="validateField('age')"
              type="number" 
              min="13" 
              max="120"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
              :class="getFieldClass('age')"
              placeholder="Enter your age (13-120)"
            >
            <div v-if="fieldErrors.age" class="text-red-600 text-xs mt-1">
              {{ fieldErrors.age }}
            </div>
            <div v-if="fieldSuccess.age" class="text-green-600 text-xs mt-1">
              ✓ Valid age
            </div>
          </div>

          <!-- Phone Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input 
              v-model="formData.phone" 
              @input="validateField('phone')"
              @blur="validateField('phone')"
              type="tel" 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
              :class="getFieldClass('phone')"
              placeholder="+1 (555) 123-4567"
            >
            <div v-if="fieldErrors.phone" class="text-red-600 text-xs mt-1">
              {{ fieldErrors.phone }}
            </div>
            <div v-if="fieldSuccess.phone" class="text-green-600 text-xs mt-1">
              ✓ Valid phone format
            </div>
          </div>

          <!-- Terms Checkbox -->
          <div>
            <label class="flex items-center">
              <input 
                v-model="formData.acceptTerms" 
                @change="validateField('acceptTerms')"
                type="checkbox" 
                class="mr-2 text-rose-600 focus:ring-rose-500"
              >
              <span class="text-sm text-gray-700">I accept the Terms of Service and Privacy Policy *</span>
            </label>
            <div v-if="fieldErrors.acceptTerms" class="text-red-600 text-xs mt-1">
              {{ fieldErrors.acceptTerms }}
            </div>
          </div>

          <!-- Newsletter Checkbox -->
          <div>
            <label class="flex items-center">
              <input 
                v-model="formData.newsletter" 
                type="checkbox" 
                class="mr-2 text-rose-600 focus:ring-rose-500"
              >
              <span class="text-sm text-gray-700">Subscribe to newsletter for updates</span>
            </label>
          </div>

          <!-- Submit Button -->
          <div class="pt-4">
            <button 
              type="submit" 
              :disabled="!isFormValid || isSubmitting"
              class="w-full px-4 py-2 rounded-md transition-colors font-medium"
              :class="isFormValid && !isSubmitting ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'"
            >
              {{ isSubmitting ? 'Creating Account...' : 'Create Account' }}
            </button>
          </div>

          <!-- Form Status -->
          <div v-if="formSubmissionResult" class="p-3 rounded-lg" :class="formSubmissionResult.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'">
            <div class="font-medium" :class="formSubmissionResult.success ? 'text-green-800' : 'text-red-800'">
              {{ formSubmissionResult.message }}
            </div>
          </div>
        </form>
      </div>

      <!-- Validation Status -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">🔍 Validation Status</h2>
        
        <div class="space-y-4">
          <!-- Field Validation Status -->
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Field Validation</h3>
            <div class="space-y-2">
              <div v-for="field in validationFields" :key="field" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm font-medium">{{ getFieldLabel(field) }}</span>
                <div class="flex items-center">
                  <div v-if="fieldErrors[field]" class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <div v-else-if="fieldSuccess[field]" class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <div v-else class="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                  <span class="text-xs" :class="fieldErrors[field] ? 'text-red-600' : fieldSuccess[field] ? 'text-green-600' : 'text-gray-500'">
                    {{ getFieldStatus(field) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Validation Rules -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Active Validation Rules</h3>
            <div class="space-y-1 text-xs">
              <div class="text-gray-600">• Username: min 3 chars, alphanumeric</div>
              <div class="text-gray-600">• Email: valid format, domain check</div>
              <div class="text-gray-600">• Password: min 8 chars, complexity</div>
              <div class="text-gray-600">• Age: 13-120 years</div>
              <div class="text-gray-600">• Phone: international format</div>
              <div class="text-gray-600">• Terms: must be accepted</div>
            </div>
          </div>

          <!-- Form Statistics -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Form Statistics</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Valid Fields:</span>
                <span class="font-semibold ml-1">{{ validFieldCount }}/{{ totalFieldCount }}</span>
              </div>
              <div>
                <span class="text-gray-600">Completion:</span>
                <span class="font-semibold ml-1">{{ Math.round((validFieldCount / totalFieldCount) * 100) }}%</span>
              </div>
              <div>
                <span class="text-gray-600">Validations:</span>
                <span class="font-semibold ml-1">{{ totalValidations }}</span>
              </div>
              <div>
                <span class="text-gray-600">Errors:</span>
                <span class="font-semibold ml-1">{{ totalErrors }}</span>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-2">Form Completion</h3>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div class="bg-rose-600 h-3 rounded-full transition-all duration-300" :style="{ width: (validFieldCount / totalFieldCount) * 100 + '%' }"></div>
            </div>
            <div class="text-xs text-gray-600 mt-1">{{ validFieldCount }} of {{ totalFieldCount }} fields completed</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Example -->
    <div class="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-white mb-4">Form Validation Implementation</h2>
      <pre class="text-green-400 text-sm overflow-x-auto"><code>// Create validation pulsers
const validateUsername = CreatePulser('validate:username', (username) => {
  const errors = []
  
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters')
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores')
  }
  
  // Simulate async username availability check
  if (username === 'admin' || username === 'root') {
    errors.push('Username is not available')
  }
  
  return {
    field: 'username',
    value: username,
    valid: errors.length === 0,
    errors,
    timestamp: Date.now()
  }
})

const validateEmail = CreatePulser('validate:email', (email) => {
  const errors = []
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    errors.push('Email is required')
  } else if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address')
  }
  
  return {
    field: 'email',
    value: email,
    valid: errors.length === 0,
    errors,
    timestamp: Date.now()
  }
})

const validatePassword = CreatePulser('validate:password', (password) => {
  const errors = []
  let strength = 0
  
  if (!password) {
    errors.push('Password is required')
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters')
    } else {
      strength++
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    } else {
      strength++
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    } else {
      strength++
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    } else {
      strength++
    }
  }
  
  return {
    field: 'password',
    value: password,
    valid: errors.length === 0,
    errors,
    strength,
    timestamp: Date.now()
  }
})

// Form validation pipeline
const validateForm = CreatePulser('validate:form', (formData) => {
  const results = {
    username: validateUsername.pulse(formData.username),
    email: validateEmail.pulse(formData.email),
    password: validatePassword.pulse(formData.password),
    // ... other field validations
  }
  
  const isValid = Object.values(results).every(result => result.valid)
  const errors = Object.values(results).flatMap(result => result.errors)
  
  return {
    valid: isValid,
    errors,
    results,
    timestamp: Date.now()
  }
})

// Real-time validation with debouncing
const debouncedValidation = CreatePulser('validate:debounced', (field, value) => {
  // Debounce validation to avoid excessive calls
  clearTimeout(validationTimeouts[field])
  
  validationTimeouts[field] = setTimeout(() => {
    const validator = getFieldValidator(field)
    const result = validator.pulse(value)
    updateFieldValidation(field, result)
  }, 300)
})</code></pre>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-rose-600 text-2xl mb-3">⚡</div>
        <h3 class="font-semibold text-gray-800 mb-2">Real-time Validation</h3>
        <p class="text-gray-600 text-sm">Instant feedback as users type with debounced validation to optimize performance.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-rose-600 text-2xl mb-3">🎯</div>
        <h3 class="font-semibold text-gray-800 mb-2">Custom Rules</h3>
        <p class="text-gray-600 text-sm">Flexible validation rules with custom logic, async checks, and complex conditions.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-rose-600 text-2xl mb-3">🔗</div>
        <h3 class="font-semibold text-gray-800 mb-2">Field Dependencies</h3>
        <p class="text-gray-600 text-sm">Validate fields based on other field values with cross-field validation rules.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-rose-600 text-2xl mb-3">📊</div>
        <h3 class="font-semibold text-gray-800 mb-2">Validation Analytics</h3>
        <p class="text-gray-600 text-sm">Track validation performance, error patterns, and user interaction metrics.</p>
      </div>
    </div>

    <!-- Validation Log -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Validation Activity Log</h2>
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div v-for="(log, index) in validationLog" :key="index" 
             class="text-sm font-mono" :class="getLogClass(log.type)">
          {{ log.message }}
        </div>
        <div v-if="validationLog.length === 0" class="text-gray-400 text-sm italic">
          No validation activity yet. Start filling out the form above!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// Form data
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: null,
  phone: '',
  acceptTerms: false,
  newsletter: false
})

// Validation state
const fieldErrors = reactive({})
const fieldSuccess = reactive({})
const isSubmitting = ref(false)
const formSubmissionResult = ref(null)
const totalValidations = ref(0)
const totalErrors = ref(0)
const validationLog = ref([])
const passwordStrength = ref(0)

// Validation configuration
const validationFields = ['username', 'email', 'password', 'confirmPassword', 'age', 'phone', 'acceptTerms']
const requiredFields = ['username', 'email', 'password', 'confirmPassword', 'age', 'acceptTerms']

// Computed properties
const validFieldCount = computed(() => {
  return validationFields.filter(field => fieldSuccess[field] && !fieldErrors[field]).length
})

const totalFieldCount = computed(() => {
  return validationFields.length
})

const isFormValid = computed(() => {
  return requiredFields.every(field => fieldSuccess[field] && !fieldErrors[field]) &&
         (!formData.phone || fieldSuccess.phone) // Phone is optional but must be valid if provided
})

// Setup validation system
const setupValidationSystem = () => {
  // Username validation
  CreatePulser('validate:username', (username) => {
    const errors = []
    
    if (!username) {
      errors.push('Username is required')
    } else {
      if (username.length < 3) {
        errors.push('Username must be at least 3 characters')
      }
      if (username.length > 20) {
        errors.push('Username must be less than 20 characters')
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores')
      }
      // Simulate unavailable usernames
      if (['admin', 'root', 'user', 'test'].includes(username.toLowerCase())) {
        errors.push('Username is not available')
      }
    }
    
    return {
      field: 'username',
      valid: errors.length === 0,
      errors
    }
  })
  
  // Email validation
  CreatePulser('validate:email', (email) => {
    const errors = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!email) {
      errors.push('Email is required')
    } else {
      if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address')
      }
      // Simulate blocked domains
      if (email.includes('tempmail.') || email.includes('10minutemail.')) {
        errors.push('Temporary email addresses are not allowed')
      }
    }
    
    return {
      field: 'email',
      valid: errors.length === 0,
      errors
    }
  })
  
  // Password validation
  CreatePulser('validate:password', (password) => {
    const errors = []
    let strength = 0
    
    if (!password) {
      errors.push('Password is required')
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters')
      } else {
        strength++
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
      } else {
        strength++
      }
      
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
      } else {
        strength++
      }
      
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number')
      } else {
        strength++
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        // Optional special character for extra strength
        if (strength === 4) strength++
      }
      
      // Check for common weak passwords
      const weakPasswords = ['password', '12345678', 'qwerty123', 'admin123']
      if (weakPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common, please choose a stronger password')
        strength = 1
      }
    }
    
    passwordStrength.value = strength
    
    return {
      field: 'password',
      valid: errors.length === 0,
      errors,
      strength
    }
  })
  
  // Confirm password validation
  CreatePulser('validate:confirmPassword', (confirmPassword) => {
    const errors = []
    
    if (!confirmPassword) {
      errors.push('Please confirm your password')
    } else if (confirmPassword !== formData.password) {
      errors.push('Passwords do not match')
    }
    
    return {
      field: 'confirmPassword',
      valid: errors.length === 0,
      errors
    }
  })
  
  // Age validation
  CreatePulser('validate:age', (age) => {
    const errors = []
    
    if (!age) {
      errors.push('Age is required')
    } else {
      if (age < 13) {
        errors.push('You must be at least 13 years old')
      }
      if (age > 120) {
        errors.push('Please enter a valid age')
      }
    }
    
    return {
      field: 'age',
      valid: errors.length === 0,
      errors
    }
  })
  
  // Phone validation (optional)
  CreatePulser('validate:phone', (phone) => {
    const errors = []
    
    if (phone) {
      // Basic international phone format
      const phoneRegex = /^[+]?[1-9]\d{1,14}$/
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
      
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('Please enter a valid phone number')
      }
      if (cleanPhone.length < 10) {
        errors.push('Phone number is too short')
      }
    }
    
    return {
      field: 'phone',
      valid: errors.length === 0,
      errors
    }
  })
  
  // Terms validation
  CreatePulser('validate:acceptTerms', (acceptTerms) => {
    const errors = []
    
    if (!acceptTerms) {
      errors.push('You must accept the Terms of Service')
    }
    
    return {
      field: 'acceptTerms',
      valid: errors.length === 0,
      errors
    }
  })
  
  // Form submission
  CreatePulser('submit:form', (formData) => {
    // Simulate form submission
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate random success/failure
        const success = Math.random() > 0.2 // 80% success rate
        
        if (success) {
          resolve({
            success: true,
            message: 'Account created successfully! Welcome aboard!',
            userId: Math.random().toString(36).substr(2, 9)
          })
        } else {
          resolve({
            success: false,
            message: 'Registration failed. Please try again later.',
            error: 'Server temporarily unavailable'
          })
        }
      }, 2000) // Simulate network delay
    })
  })
}

// Validation functions
const validateField = (fieldName) => {
  const value = formData[fieldName]
  
  try {
    const result = Pulsor(`validate:${fieldName}`).pulse(value)
    
    if (result.valid) {
      fieldErrors[fieldName] = null
      fieldSuccess[fieldName] = true
      logValidation(`${getFieldLabel(fieldName)} validation passed`, 'success')
    } else {
      fieldErrors[fieldName] = result.errors[0] // Show first error
      fieldSuccess[fieldName] = false
      totalErrors.value++
      logValidation(`${getFieldLabel(fieldName)} validation failed: ${result.errors[0]}`, 'error')
    }
    
    totalValidations.value++
  } catch (error) {
    fieldErrors[fieldName] = 'Validation error occurred'
    fieldSuccess[fieldName] = false
    logValidation(`${getFieldLabel(fieldName)} validation error: ${error.message}`, 'error')
  }
}

const submitForm = async () => {
  // Validate all fields before submission
  validationFields.forEach(field => validateField(field))
  
  if (!isFormValid.value) {
    logValidation('Form submission blocked - validation errors present', 'error')
    return
  }
  
  isSubmitting.value = true
  formSubmissionResult.value = null
  logValidation('Form submission started', 'info')
  
  try {
    const result = await Pulsor('submit:form').pulse(formData)
    formSubmissionResult.value = result
    
    if (result.success) {
      logValidation('Form submitted successfully', 'success')
      // Reset form on success
      setTimeout(() => {
        resetForm()
      }, 3000)
    } else {
      logValidation(`Form submission failed: ${result.message}`, 'error')
    }
  } catch (error) {
    formSubmissionResult.value = {
      success: false,
      message: 'Submission failed due to network error'
    }
    logValidation(`Form submission error: ${error.message}`, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  Object.keys(formData).forEach(key => {
    if (typeof formData[key] === 'boolean') {
      formData[key] = false
    } else if (typeof formData[key] === 'number') {
      formData[key] = null
    } else {
      formData[key] = ''
    }
  })
  
  Object.keys(fieldErrors).forEach(key => {
    fieldErrors[key] = null
  })
  
  Object.keys(fieldSuccess).forEach(key => {
    fieldSuccess[key] = false
  })
  
  formSubmissionResult.value = null
  passwordStrength.value = 0
  logValidation('Form reset', 'info')
}

// Utility functions
const getFieldClass = (fieldName) => {
  if (fieldErrors[fieldName]) {
    return 'border-red-500 focus:ring-red-500'
  } else if (fieldSuccess[fieldName]) {
    return 'border-green-500 focus:ring-green-500'
  } else {
    return 'border-gray-300 focus:ring-rose-500'
  }
}

const getFieldLabel = (fieldName) => {
  const labels = {
    username: 'Username',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    age: 'Age',
    phone: 'Phone',
    acceptTerms: 'Terms Acceptance'
  }
  return labels[fieldName] || fieldName
}

const getFieldStatus = (fieldName) => {
  if (fieldErrors[fieldName]) {
    return 'Invalid'
  } else if (fieldSuccess[fieldName]) {
    return 'Valid'
  } else {
    return 'Pending'
  }
}

const getPasswordStrengthText = () => {
  switch (passwordStrength.value) {
    case 0:
    case 1: return 'Weak password'
    case 2: return 'Fair password'
    case 3: return 'Good password'
    case 4: return 'Strong password'
    case 5: return 'Very strong password'
    default: return 'Password strength unknown'
  }
}

const logValidation = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  validationLog.value.unshift({
    message: `[${timestamp}] ${message}`,
    type,
    timestamp: Date.now()
  })
  
  // Keep only last 20 entries
  if (validationLog.value.length > 20) {
    validationLog.value = validationLog.value.slice(0, 20)
  }
}

const getLogClass = (type) => {
  switch (type) {
    case 'error': return 'text-red-600'
    case 'success': return 'text-green-600'
    case 'warning': return 'text-orange-600'
    case 'info': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}

// Lifecycle hooks
onMounted(() => {
  setupValidationSystem()
  logValidation('Form Validation demo initialized', 'info')
})

onUnmounted(() => {
  logValidation('Form Validation demo unmounted', 'info')
})
</script>