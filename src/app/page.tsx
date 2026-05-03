import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-6 max-w-2xl p-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-blue-500">
          Green Corridor
        </h1>
        <h2 className="text-2xl font-semibold text-slate-300">
          Emergency Vehicle Priority System
        </h2>
        <p className="text-slate-400">
          AI-powered traffic clearance for ambulances. 
          Seamlessly integrating Smart City APIs with IoT Hardware.
        </p>
        
        <div className="pt-8">
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-blue-900/50 transition-all">
              Launch System
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-xs text-slate-600">
        System Status: <span className="text-green-500">Online</span> | 
        Server: <span className="text-green-500">Connected</span>
      </div>
    </div>
  );
}