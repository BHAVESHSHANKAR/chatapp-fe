import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function Landing() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Animation hook for intersection observer
    const useIntersectionObserver = (options = {}) => {
        const [isVisible, setIsVisible] = useState(false)
        const ref = useRef(null)

        useEffect(() => {
            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.unobserve(entry.target)
                }
            }, {
                threshold: 0.1,
                rootMargin: '50px',
                ...options
            })

            if (ref.current) {
                observer.observe(ref.current)
            }

            return () => {
                if (ref.current) {
                    observer.unobserve(ref.current)
                }
            }
        }, [])

        return [ref, isVisible]
    }

    // Create refs for each section
    const [heroRef, heroVisible] = useIntersectionObserver()
    const [featuresRef, featuresVisible] = useIntersectionObserver()
    const [statsRef, statsVisible] = useIntersectionObserver()
    const [testimonialsRef, testimonialsVisible] = useIntersectionObserver()
    const [ctaRef, ctaVisible] = useIntersectionObserver()

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="relative z-50 px-6 py-6 border-b border-gray-100">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">PlayChat</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/auth" 
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link 
                                to="/auth" 
                                className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] hover:from-[#2c5364] hover:to-[#0F2027] text-white px-6 py-2.5 rounded-lg font-medium transition-all transform hover:scale-105"
                            >
                                Chat Now
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-900"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100">
                        <div className="px-6 py-4 space-y-4">
                            <div className="pt-4 space-y-3">
                                <Link 
                                    to="/auth" 
                                    className="block w-full text-gray-600 hover:text-gray-900 font-medium transition-colors text-left"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link 
                                    to="/auth" 
                                    className="block w-full bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white px-6 py-2.5 rounded-lg font-medium transition-all text-center"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Chat Now
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="px-6 py-24">
                <div className="max-w-7xl mx-auto">
                    <div
                        ref={heroRef}
                        className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${heroVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <div className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-full text-sm font-medium text-gray-600 mb-8">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Now available worldwide
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                            Connect & Chat with
                            <span className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] bg-clip-text text-transparent"> Friends</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                            Stay connected with friends through individual and group chats. Share moments, create memories, and never miss a conversation.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            <Link 
                                to="/auth" 
                                className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] hover:from-[#2c5364] hover:to-[#0F2027] text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                            >
                                Chat Now
                            </Link>
                        </div>

                        {/* Hero Image/Mockup */}
                        <div className="relative">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 shadow-2xl">
                                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex space-x-2">
                                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">PlayChat</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-xs text-gray-500">Online</span>
                                        </div>
                                    </div>
                                    <div className="h-80 bg-white flex flex-col">
                                        {/* Chat Header */}
                                        <div className="px-4 py-3 border-b border-gray-200 flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                A
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Alex & Friends</div>
                                                <div className="text-xs text-green-500 flex items-center">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                                    3 online
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chat Messages */}
                                        <div className="flex-1 p-4 space-y-4 overflow-hidden">
                                            {/* Friend's message */}
                                            <div className="flex items-start space-x-2">
                                                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                                    S
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-2 max-w-xs">
                                                        <p className="text-gray-800 text-sm">Hey everyone! Who's up for pizza tonight? 🍕</p>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">Sarah • 2:30 PM</div>
                                                </div>
                                            </div>

                                            {/* Your message */}
                                            <div className="flex items-start space-x-2 justify-end">
                                                <div className="flex-1 flex justify-end">
                                                    <div className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-2xl rounded-tr-md px-4 py-2 max-w-xs">
                                                        <p className="text-white text-sm">Count me in! What time?</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Another friend's message */}
                                            <div className="flex items-start space-x-2">
                                                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                                    M
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-2 max-w-xs">
                                                        <p className="text-gray-800 text-sm">7 PM works for me! 🙌</p>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">Mike • 2:32 PM</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Typing indicator */}
                                        <div className="px-4 py-2 border-t border-gray-100">
                                            <div className="flex items-center space-x-2 text-gray-500 text-sm">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                                <span>Emma is typing...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-6 py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div
                        ref={featuresRef}
                        className={`text-center mb-20 transition-all duration-1000 ${featuresVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Chat Features You'll Love
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Everything you need for seamless individual and group conversations
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Individual Chat */}
                        <div className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100 duration-1000 ${featuresVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '100ms' }}>
                            <div className="w-14 h-14 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Individual Chat</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Private one-on-one conversations with friends. Share thoughts, photos, and stay connected.
                            </p>
                        </div>

                        {/* Group Chat */}
                        <div className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100 duration-1000 ${featuresVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '200ms' }}>
                            <div className="w-14 h-14 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Group Chat</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Create groups with friends and family. Plan events, share memories, and stay in touch together.
                            </p>
                        </div>

                        {/* Media Sharing */}
                        <div className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100 duration-1000 ${featuresVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '300ms' }}>
                            <div className="w-14 h-14 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Media Sharing</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Share photos, videos, and files instantly. Relive moments and keep memories alive.
                            </p>
                        </div>

                        {/* Real-time Features */}
                        <div className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100 duration-1000 ${featuresVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '400ms' }}>
                            <div className="w-14 h-14 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Features</h3>
                            <p className="text-gray-600 leading-relaxed">
                                See when friends are typing, know when messages are read, and react with emojis.
                            </p>
                        </div>

                        {/* Privacy & Security */}
                        <div className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100 duration-1000 ${featuresVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '500ms' }}>
                            <div className="w-14 h-14 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Privacy & Security</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Your conversations are secure with end-to-end encryption. Chat with confidence.
                            </p>
                        </div>

                        {/* Cross-Platform */}
                        <div className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100 duration-1000 ${featuresVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '600ms' }}>
                            <div className="w-14 h-14 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Cross-Platform</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Chat seamlessly across all your devices. Start on mobile, continue on desktop.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            {/* Stats Section */}
            <section className="px-6 py-24 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div
                        ref={statsRef}
                        className={`text-center mb-16 transition-all duration-1000 ${statsVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Connecting friends worldwide
                        </h2>
                        <p className="text-lg text-gray-600">
                            Join millions of people already chatting on PlayChat
                        </p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        <div className={`space-y-3 transition-all duration-1000 ${statsVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '100ms' }}>
                            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0F2027] to-[#2c5364] bg-clip-text text-transparent">5M+</div>
                            <div className="text-gray-600 text-lg font-medium">Happy Users</div>
                        </div>
                        <div className={`space-y-3 transition-all duration-1000 ${statsVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '200ms' }}>
                            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0F2027] to-[#2c5364] bg-clip-text text-transparent">2B+</div>
                            <div className="text-gray-600 text-lg font-medium">Messages Shared</div>
                        </div>
                        <div className={`space-y-3 transition-all duration-1000 ${statsVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '300ms' }}>
                            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0F2027] to-[#2c5364] bg-clip-text text-transparent">1M+</div>
                            <div className="text-gray-600 text-lg font-medium">Group Chats</div>
                        </div>
                        <div className={`space-y-3 transition-all duration-1000 ${statsVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '400ms' }}>
                            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0F2027] to-[#2c5364] bg-clip-text text-transparent">180+</div>
                            <div className="text-gray-600 text-lg font-medium">Countries</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="px-6 py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div
                        ref={testimonialsRef}
                        className={`text-center mb-16 transition-all duration-1000 ${testimonialsVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Loved by friends everywhere
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            See what people are saying about their PlayChat experience
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 transition-all duration-1000 ${testimonialsVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '100ms' }}>
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    E
                                </div>
                                <div className="ml-4">
                                    <div className="text-gray-900 font-semibold">Emma Wilson</div>
                                    <div className="text-gray-500 text-sm">College Student</div>
                                </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                "PlayChat keeps me connected with my friends across different colleges. The group chats are perfect for planning hangouts!"
                            </p>
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>

                        <div className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 transition-all duration-1000 ${testimonialsVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '200ms' }}>
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    J
                                </div>
                                <div className="ml-4">
                                    <div className="text-gray-900 font-semibold">Jake Martinez</div>
                                    <div className="text-gray-500 text-sm">Freelance Designer</div>
                                </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                "I love how secure PlayChat is. I can share personal moments with family knowing our conversations are private."
                            </p>
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>

                        <div className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 transition-all duration-1000 ${testimonialsVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-10'
                            }`} style={{ transitionDelay: '300ms' }}>
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    L
                                </div>
                                <div className="ml-4">
                                    <div className="text-gray-900 font-semibold">Lisa Chen</div>
                                    <div className="text-gray-500 text-sm">Travel Blogger</div>
                                </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                "The media sharing is amazing! I can instantly share my travel photos with friends and family around the world."
                            </p>
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 py-24 bg-white">
                <div
                    ref={ctaRef}
                    className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${ctaVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-10'
                        }`}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Ready to start
                        <span className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] bg-clip-text text-transparent"> chatting?</span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                        Join millions of people already connecting with friends on PlayChat. It's free and always will be.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link 
                            to="/auth" 
                            className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] hover:from-[#2c5364] hover:to-[#0F2027] text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                        >
                            Chat Now
                        </Link>
                    </div>
                    <p className="text-sm text-gray-500 mt-6">
                        Free forever • No credit card required • Start chatting instantly
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-12 bg-gray-900">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#0F2027] to-[#2c5364] rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-white">PlayChat</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        © 2025 PlayChat. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default Landing