import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'

function Authenticate() {
    const navigate = useNavigate()
    const [isSignUp, setIsSignUp] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    })

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        try {
            if (isSignUp) {
                // Register new user
                const response = await authService.register(formData)
                console.log('Registration successful:', response.data)
                // Auto switch to sign in after successful registration
                toggleMode()
            } else {
                // Login existing user
                const response = await authService.login(formData)
                console.log('Login successful:', response.data)
                
                // Store token and user data handled by authService
                localStorage.setItem('token', response.data.token)
                localStorage.setItem('user', JSON.stringify({
                    id: response.data.id,
                    username: response.data.username,
                    email: response.data.email,
                    profileImageUrl: response.data.profileImageUrl
                }))
                
                // Redirect to home page or dashboard
                navigate('/home')
            }
        } catch (err) {
            console.error('Authentication error:', err)
            setError(
                err.response?.data?.message || 
                'An error occurred during authentication. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    const toggleMode = () => {
        setIsTransitioning(true)
        setTimeout(() => {
            setIsSignUp(!isSignUp)
            setFormData({ username: '', email: '', password: '' })
            setShowPassword(false)
            setTimeout(() => setIsTransitioning(false), 100)
        }, 400)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)]">
                <div className="flex flex-col md:flex-row min-h-[500px]">

                    {/* Left Panel - Welcome/Info */}
                    <div className={`flex-1 bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2c5364] p-6 md:p-10 flex flex-col justify-center text-white relative overflow-hidden transition-all duration-700 ease-in-out transform ${isSignUp ? 'md:order-2 md:translate-x-0' : 'md:order-1 md:translate-x-0'
                        }`}>
                        {/* Decorative circles */}
                        <div className={`absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl transition-all duration-700 ${isTransitioning ? 'scale-110 opacity-50' : 'scale-100 opacity-100'
                            }`}></div>
                        <div className={`absolute bottom-10 left-10 w-24 h-24 bg-white/5 rounded-full blur-lg transition-all duration-700 ${isTransitioning ? 'scale-90 opacity-30' : 'scale-100 opacity-100'
                            }`}></div>

                        <div className={`text-center md:text-left transition-all duration-500 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                            }`}>
                            {!isSignUp ? (
                                <div className="animate-fade-in">
                                    <h2 className="text-3xl md:text-4xl font-bold mb-6 transition-all duration-500">
                                        Welcome back!
                                    </h2>
                                    <p className="text-lg text-white/80 mb-8 leading-relaxed transition-all duration-500">
                                        Enter your personal details to use all of site features
                                    </p>
                                    <button
                                        onClick={toggleMode}
                                        className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 hover:border-white/50 px-8 py-3 rounded-full font-semibold transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
                                    >
                                        SIGN UP
                                    </button>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <h2 className="text-3xl md:text-4xl font-bold mb-6 transition-all duration-500">
                                        Hello There!
                                    </h2>
                                    <p className="text-lg text-white/80 mb-8 leading-relaxed transition-all duration-500">
                                        Register with your personal details to use all of site features
                                    </p>
                                    <button
                                        onClick={toggleMode}
                                        className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 hover:border-white/50 px-8 py-3 rounded-full font-semibold transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
                                    >
                                        SIGN IN
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Form */}
                    <div className={`flex-1 p-6 md:p-10 flex flex-col justify-center transition-all duration-700 ease-in-out transform ${isSignUp ? 'md:order-1 md:translate-x-0' : 'md:order-2 md:translate-x-0'
                        }`}>
                        <div className="w-full max-w-sm mx-auto">

                            {/* PlayChat Logo */}
                            <div className={`flex items-center justify-center mb-8 transition-all duration-500 ${isTransitioning ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
                                }`}>
                                <div className="w-12 h-12 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-xl flex items-center justify-center mr-3 transition-all duration-300 hover:scale-110">
                                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold text-gray-800">PlayChat</span>
                            </div>

                            <h3 className={`text-2xl font-bold text-gray-800 text-center mb-8 transition-all duration-500 ${isTransitioning ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
                                }`}>
                                {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
                            </h3>

                            <form onSubmit={handleSubmit} className={`space-y-6 transition-all duration-500 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                                }`}>
                                {/* Username field with smooth slide animation */}
                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSignUp
                                    ? 'max-h-20 opacity-100 transform translate-y-0'
                                    : 'max-h-0 opacity-0 transform -translate-y-2'
                                    }`}>
                                    <div className="transform transition-all duration-400 ease-in-out hover:scale-[1.02] group mb-6">
                                        <div className="relative border border-gray-200 rounded-xl bg-gray-50 hover:border-gray-300 group-focus-within:ring-2 group-focus-within:ring-[#2c5364] group-focus-within:border-transparent group-focus-within:bg-white transition-all duration-300">
                                            <input
                                                type="text"
                                                name="username"
                                                placeholder="Username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-transparent border-none rounded-xl focus:outline-none transition-all duration-300 placeholder-gray-400 pl-10"
                                                required={isSignUp}
                                            />
                                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-[#2c5364] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="transform transition-all duration-400 ease-in-out hover:scale-[1.02] group">
                                    <div className="relative border border-gray-200 rounded-xl bg-gray-50 hover:border-gray-300 group-focus-within:ring-2 group-focus-within:ring-[#2c5364] group-focus-within:border-transparent group-focus-within:bg-white transition-all duration-300">
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-transparent border-none rounded-xl focus:outline-none transition-all duration-300 placeholder-gray-400 pl-10"
                                            required
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-[#2c5364] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                </div>

                                <div className="transform transition-all duration-400 ease-in-out hover:scale-[1.02] group">
                                    <div className="relative border border-gray-200 rounded-xl bg-gray-50 hover:border-gray-300 group-focus-within:ring-2 group-focus-within:ring-[#2c5364] group-focus-within:border-transparent group-focus-within:bg-white transition-all duration-300">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-transparent border-none rounded-xl focus:outline-none transition-all duration-300 placeholder-gray-400 pl-10 pr-10"
                                            required
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-[#2c5364] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                        </svg>
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#2c5364] group-focus-within:text-[#2c5364] transition-colors duration-200 focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Forgot password link with smooth transition */}
                                <div className={`text-center overflow-hidden transition-all duration-500 ease-in-out ${!isSignUp
                                    ? 'max-h-10 opacity-100 transform translate-y-0'
                                    : 'max-h-0 opacity-0 transform -translate-y-2'
                                    }`}>
                                    <a href="#" className="text-sm text-gray-600 hover:text-[#2c5364] transition-all duration-300 hover:underline">
                                        Forget your password?
                                    </a>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-lg border border-red-200">
                                        {error}
                                    </div>
                                )}
                                
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full bg-gradient-to-r from-[#0F2027] to-[#2c5364] hover:from-[#2c5364] hover:to-[#0F2027] text-white py-3 rounded-xl font-semibold transition-all duration-500 transform hover:scale-[1.03] shadow-lg hover:shadow-[0_10px_25px_rgba(44,_83,_100,_0.5)] active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {isSignUp ? 'SIGNING UP...' : 'SIGNING IN...'}
                                        </span>
                                    ) : (
                                        isSignUp ? 'SIGN UP' : 'SIGN IN'
                                    )}
                                </button>
                            </form>

                            {/* Toggle link for mobile */}
                            <div className={`mt-8 text-center md:hidden transition-all duration-500 ${isTransitioning ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
                                }`}>
                                <p className="text-gray-600 transition-all duration-300">
                                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                    <button
                                        onClick={toggleMode}
                                        className="ml-2 text-[#2c5364] font-semibold hover:underline transition-all duration-300 transform hover:scale-105"
                                    >
                                        {isSignUp ? 'Sign In' : 'Sign Up'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Authenticate