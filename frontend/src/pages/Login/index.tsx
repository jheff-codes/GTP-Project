import { useLogin } from './hooks/useLogin';
import { LoginBackground } from './components/LoginBackground';
import { LoginHeader } from './components/LoginHeader';
import { CategorySelector } from './components/CategorySelector';
import { LoginForm } from './components/LoginForm';

export default function Login() {
    const {
        selectedCategory,
        email,
        setEmail,
        password,
        setPassword,
        showPassword,
        setShowPassword,
        isLoading,
        error,
        handleSelectCategory,
        handleBack,
        handleLogin,
    } = useLogin();

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glows */}
            <LoginBackground />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
                {/* Logo & Branding */}
                <LoginHeader />

                {/* Main Card */}
                <div className="w-full rounded-[2.5rem] bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {!selectedCategory ? (
                        <CategorySelector onSelectCategory={handleSelectCategory} />
                    ) : (
                        <LoginForm
                            selectedCategory={selectedCategory}
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            isLoading={isLoading}
                            error={error}
                            onSubmit={handleLogin}
                            onBack={handleBack}
                        />
                    )}
                </div>

                {/* Footer Credits */}
                <div className="mt-10 text-center">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
                        © 2026 GTP Smart AI. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
