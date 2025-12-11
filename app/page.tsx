"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { GraduationCap, Mail, Lock, UserCircle, Loader2, Eye, EyeOff } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"

export default function LoginPage() {
  const [showSplash, setShowSplash] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmittingReset, setIsSubmittingReset] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("selectedRole", role)
        router.push("/dashboard")
      } else {
        toast.error(data.error || data.message || "Login failed")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    // e.stopPropagation()
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }
    
    setIsSubmittingReset(true)

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: forgotEmail,
          newPassword: newPassword 
        }),
      })

      const data = await res.json()
      console.log("Forgot password response:", res.status, data)

      if (res.ok) {
        toast.success("Password updated successfully")
        setIsForgotPasswordOpen(false)
        setForgotEmail("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(data.error || data.message || "Failed to update password")
      }
    } catch (err) {
      console.error("Forgot password error:", err)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsSubmittingReset(false)
    }
  }

  if (showSplash) {
    return (
      <div className="flex items-center justify-center h-screen bg-purple-700 text-white animate-fade-in">
        <div className="flex flex-col items-center">
          <p className="text-xl font-light">Powered by</p>
          <img src="/images/CITBIF_logo.png" alt="Logo" className="w-24 h-24" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] opacity-5"></div>

      <Card className="w-full max-w-md glass-effect border-white/20 animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-white/100 rounded-full flex items-center justify-center overflow-hidden">
            <img src="/images/CIT_logo.jpg" alt="Logo"/>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">CIT CSMS Portal</CardTitle>
            <CardDescription className="text-white/80">Access your academic dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-white/90 flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Role
              </Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superuser">Super User</SelectItem>
                  <SelectItem value="hod">Head of Department</SelectItem>
                  <SelectItem value="faculty">Faculty Member</SelectItem>
                  <SelectItem value="subject-expert">Subject Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold py-3 flex items-center justify-center gap-2"
              disabled={loading} 
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-white/80 hover:text-white text-sm">
                  Forgot Password?
                </Button>
              </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Enter your email address and your new password.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email Address</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="Enter your email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password (min 6 characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Retype new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsForgotPasswordOpen(false)
                          setForgotEmail("")
                          setNewPassword("")
                          setConfirmPassword("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={isSubmittingReset}
                      >
                        {isSubmittingReset ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
        </CardContent>
      </Card>
      <Toaster position="top-center" />
    </div>
  )
}
