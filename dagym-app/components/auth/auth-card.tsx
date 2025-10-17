"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { X, Mail, Eye, EyeOff } from "lucide-react"
import { register, login } from "@/services/auth"
import { useRouter } from "next/navigation" // ✅ CORRETO

interface AuthCardProps {
  isLoading: boolean
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  rememberMe: boolean
  setRememberMe: (remember: boolean) => void
  onForgotPassword: () => void
}

export function AuthCard({
  isLoading,
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  onForgotPassword,
}: AuthCardProps) {
  const [activeTab, setActiveTab] = useState("signup")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter() // ✅ instancia do hook

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newUser = await register({
        nome: firstName + " " + lastName,
        username: email.split("@")[0],
        email,
        password,
      })
      console.log("Usuário registrado:", newUser)
      alert("Conta criada com sucesso!")
    } catch (error) {
      console.error(error)
      alert("Erro ao criar conta")
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await login(email, password)
      console.log("Token recebido:", res.token)
      localStorage.setItem("token", res.token)
      alert("Login realizado com sucesso!")

      router.push("/dashboard") // ✅ redireciona corretamente
    } catch (error) {
      console.error(error)
      alert("Email ou senha incorretos")
    }
  }


  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
      <div className="hidden md:flex flex-1 justify-center items-center">
        <Image
          src="/logo-dagym.png"
          alt="Logo Dagym"
          width={400}
          height={400}
          className="rounded-[32px] object-contain"
          priority
        />
      </div>

      <div className="flex-1 w-full max-w-md">
        <div className="bg-[#490707] backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex bg-black/30 backdrop-blur-sm rounded-full p-1 border border-white/10">
              <button
                onClick={() => setActiveTab("signup")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  activeTab === "signup"
                    ? "bg-white/20 backdrop-blur-sm text-white border border-white/20 shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Criar conta
              </button>
              <button
                onClick={() => setActiveTab("signin")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  activeTab === "signin"
                    ? "bg-white/20 backdrop-blur-sm text-white border border-white/20 shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Entrar
              </button>
            </div>
            <button className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:bg-black/40 transition-all duration-200 hover:scale-110 hover:rotate-90">
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>

          <h1 className="text-3xl font-normal text-white mb-8 transition-all duration-300">
            {activeTab === "signup" ? "Crie sua conta" : "Bem-vindo(a) de volta"}
          </h1>


          <div className="relative overflow-hidden">
            <div
              className={`transition-all duration-500 ease-in-out transform ${
                activeTab === "signup"
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-full opacity-0 absolute inset-0"
              }`}
            >
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nome"
                    className="bg-black/20 border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40"
                  />
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Usuário"
                    className="bg-black/20 border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu email"
                    className="bg-black/20 border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 pl-12"
                  />
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="bg-black/20 border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/20 rounded-2xl h-14 mt-8"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </div>

            <div
              className={`transition-all duration-500 ease-in-out transform ${
                activeTab === "signin"
                  ? "translate-x-0 opacity-100"
                  : "translate-x-full opacity-0 absolute inset-0"
              }`}
            >
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu email"
                    className="bg-black/20 border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 pl-12"
                  />
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="bg-black/20 border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border border-white/20 bg-black/20 text-white"
                    />
                    <span className="text-white/60 text-sm">Lembrar de mim</span>
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-white/60 hover:text-white text-sm"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/20 rounded-2xl h-14 mt-8"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </div>
          </div>

          <p className="text-center text-white/40 text-sm mt-8">
            {activeTab === "signup"
              ? "Ao criar uma conta, você concorda com nossos Termos de Serviço"
              : "Ao entrar, você concorda com nossos Termos de Serviço"}
          </p>
        </div>
      </div>
    </div>
  )
}
