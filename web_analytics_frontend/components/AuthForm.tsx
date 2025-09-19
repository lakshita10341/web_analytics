"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [siteId, setSiteId] = useState<string | null>(null);
  const router = useRouter();
  async function handleSubmit() {
    try {
      if (mode === "signup") {
        await axios.post("http://localhost:8000/api/signup/", {
          username,
          password,
        });
      }
  
      const res = await axios.post("http://localhost:8000/api/login/", {
        username,
        password,
      });
  
      const data = res.data; 
  
   
      localStorage.setItem("token", data.access);
  
      router.push("/sites");

    } catch (error) {
      console.error("An error occurred during the request:", error);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-xl"
    >
      <h2 className="text-2xl font-bold mb-4 text-center capitalize">{mode}</h2>
      <div className="space-y-4">
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={handleSubmit} className="w-full">
          {mode === "signup" ? "Sign Up" : "Log In"}
        </Button>
      </div>

    </motion.div>
  );
}
