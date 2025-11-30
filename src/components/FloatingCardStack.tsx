const FloatingCardStack = () => {
  return (
    <div className="relative w-full max-w-sm mx-auto h-48 mt-8 mb-6">
      {/* Card 1 - Back */}
      <div 
        className="absolute top-8 left-1/2 -translate-x-1/2 w-64 h-40 rounded-xl shadow-lg animate-[float_6s_ease-in-out_infinite]"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 100%)',
          transform: 'translateX(-50%) rotate(-6deg) translateY(0px)',
          animationDelay: '0s'
        }}
      >
        <div className="w-full h-full rounded-xl border border-primary/20 backdrop-blur-sm" />
      </div>

      {/* Card 2 - Middle */}
      <div 
        className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-40 rounded-xl shadow-lg animate-[float_6s_ease-in-out_infinite]"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0.1) 100%)',
          transform: 'translateX(-50%) rotate(-3deg) translateY(0px)',
          animationDelay: '0.5s'
        }}
      >
        <div className="w-full h-full rounded-xl border border-primary/30 backdrop-blur-sm" />
      </div>

      {/* Card 3 - Front (Featured) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-40 rounded-xl shadow-xl animate-[float_6s_ease-in-out_infinite]"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.25) 0%, hsl(var(--primary) / 0.15) 100%)',
          transform: 'translateX(-50%) rotate(0deg) translateY(0px)',
          animationDelay: '1s'
        }}
      >
        <div className="w-full h-full rounded-xl border border-primary/40 backdrop-blur-sm p-6 flex flex-col justify-between">
          {/* Card chip */}
          <div className="flex justify-between items-start">
            <div className="w-10 h-8 rounded bg-primary/20 border border-primary/30" />
            <div className="text-xs font-mono text-primary/60">VISA</div>
          </div>
          
          {/* Card number placeholder */}
          <div className="space-y-1">
            <div className="flex gap-2">
              <div className="w-8 h-2 rounded bg-primary/15" />
              <div className="w-8 h-2 rounded bg-primary/15" />
              <div className="w-8 h-2 rounded bg-primary/15" />
              <div className="w-8 h-2 rounded bg-primary/15" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-12px); }
        }
      `}</style>
    </div>
  );
};

export default FloatingCardStack;
