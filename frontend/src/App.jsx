import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import mermaid from "mermaid";
import { toPng } from "html-to-image";

// Initialize Mermaid with cyberpunk theme
mermaid.initialize({ 
  startOnLoad: false, 
  theme: "dark",
  securityLevel: 'loose',
  fontFamily: 'Orbitron, monospace',
  themeVariables: {
    primaryColor: '#00ffff',
    primaryTextColor: '#00ffff',
    primaryBorderColor: '#00ffff',
    lineColor: '#00ffff',
    secondaryColor: '#ff00ff',
    tertiaryColor: '#000000',
    background: '#000000',
    mainBkg: '#000000',
    secondBkg: '#1a1a1a',
    tertiaryBkg: '#2a2a2a'
  }
});

export default function App() {
  const [topic, setTopic] = useState("");
  const [raw, setRaw] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef(null);
  const exportRef = useRef(null);
  const renderIdRef = useRef(0);

  const sanitize = useCallback((code) => {
    if (!code) return "";
    
    code = code.trim();
    
    if (!code.match(/^(graph|flowchart|sequenceDiagram|classDiagram|gitGraph|pie|journey)/i)) {
      code = `graph TD;\n${code}`;
    }
    
    code = code.replace(/^(graph\s+(?:TD|TB|BT|RL|LR))\b(?!;)/i, "$1;");
    code = code.replace(/^(graph\s+(?:TD|TB|BT|RL|LR));?/, "$1;\n");
    
    code = code.replace(/(\[[^\]]*?[^"\]]\])/g, (match) => {
      const label = match.slice(1, -1).trim();
      if (label.includes(':') || label.includes('°') || label.includes('(')) {
        return `["${label}"]`;
      }
      return match;
    });
    
    code = code.replace(/\n\s*\n/g, '\n').replace(/;\s*;/g, ';');
    
    return code;
  }, []);

  const updatePreview = useCallback(async (code) => {
    const container = previewRef.current;
    const exportContainer = exportRef.current;
    if (!container) return;

    if (!code) {
      const emptyContent = `
        <div class="flex items-center justify-center h-full">
          <div class="text-center space-y-4">
            <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-400/30 neon-glow-cyan">
              <svg class="w-10 h-10 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <p class="text-cyan-300 font-semibold text-lg cyber-font">NEURAL GRID OFFLINE</p>
            <p class="text-cyan-500/70 text-sm font-mono">Initialize quantum diagram to activate</p>
          </div>
        </div>
      `;
      container.innerHTML = emptyContent;
      if (exportContainer) {
        exportContainer.innerHTML = emptyContent;
      }
      return;
    }

    const sanitizedCode = sanitize(code);
    const renderId = `vm-diagram-${++renderIdRef.current}`;

    try {
      setError("");
      const { svg } = await mermaid.render(renderId, sanitizedCode);
      
      if (renderIdRef.current === parseInt(renderId.split('-')[2])) {
        const displayContent = `<div class="diagram-container p-4">${svg}</div>`;
        container.innerHTML = displayContent;
        
        // For export container, create a clean version without any hidden classes
        if (exportContainer) {
          exportContainer.innerHTML = svg;
        }
        
        // Apply futuristic neon styling to display container
        const svgElement = container.querySelector('svg');
        if (svgElement) {
          svgElement.style.filter = 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.6)) drop-shadow(0 0 40px rgba(255, 0, 255, 0.3))';
          svgElement.style.borderRadius = '16px';
          svgElement.style.border = '1px solid rgba(0, 255, 255, 0.3)';
          svgElement.style.background = 'rgba(0, 0, 0, 0.4)';
          
          // Style all paths and shapes for neon effect
          const paths = svgElement.querySelectorAll('path, rect, circle, ellipse, line, polygon');
          paths.forEach(path => {
            if (path.getAttribute('stroke') && path.getAttribute('stroke') !== 'none') {
              path.style.filter = 'drop-shadow(0 0 8px currentColor)';
            }
          });
          
          // Style text elements
          const texts = svgElement.querySelectorAll('text');
          texts.forEach(text => {
            text.style.filter = 'drop-shadow(0 0 6px currentColor)';
            text.style.fontFamily = 'Orbitron, monospace';
            text.style.fontWeight = '600';
          });
        }
      }
    } catch (err) {
      console.error("Neural render error:", err);
      setError(err.message);
      const errorContent = `
        <div class="flex items-center justify-center h-full p-6">
          <div class="bg-red-500/10 border border-red-400/30 rounded-2xl p-6 max-w-md neon-glow-red">
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center border border-red-400/30">
                <svg class="w-5 h-5 text-red-400 glitch-effect" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h4 class="text-red-300 font-bold text-sm cyber-font">NEURAL ERROR</h4>
                <p class="text-red-400/80 text-sm font-mono mt-1">${err.message}</p>
              </div>
            </div>
          </div>
        </div>
      `;
      container.innerHTML = errorContent;
      if (exportContainer) exportContainer.innerHTML = errorContent;
    }
  }, [sanitize]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updatePreview(mermaidCode);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [mermaidCode, updatePreview]);

  const generate = async () => {
    if (!topic.trim()) {
      setError("NEURAL INPUT REQUIRED");
      return;
    }
    
    setLoading(true);
    setError("");
    setRaw("");
    setMermaidCode("");
    
    const container = previewRef.current;
    const exportContainer = exportRef.current;
    const loadingContent = `
      <div class="flex items-center justify-center h-full">
        <div class="text-center space-y-6">
          <div class="w-16 h-16 mx-auto relative">
            <div class="absolute inset-0 rounded-full border-4 border-cyan-500/30"></div>
            <div class="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"></div>
            <div class="absolute inset-2 rounded-full border-2 border-purple-500/30"></div>
            <div class="absolute inset-2 rounded-full border-2 border-t-purple-400 animate-spin animation-delay-75"></div>
          </div>
          <p class="text-cyan-300 font-bold text-lg cyber-font animate-pulse">NEURAL SYNTHESIS ACTIVE</p>
          <div class="flex items-center justify-center space-x-1">
            <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-150"></div>
            <div class="w-2 h-2 bg-pink-400 rounded-full animate-bounce animation-delay-300"></div>
          </div>
        </div>
      </div>
    `;
    
    if (container) container.innerHTML = loadingContent;
    if (exportContainer) exportContainer.innerHTML = loadingContent;

    try {
      // Your actual API call
      const res = await axios.post("/api/generate", 
        { topic: topic.trim() },
        { 
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      setRaw(res.data.raw || "");
      setMermaidCode(res.data.mermaid || "");
      
      if (!res.data.mermaid) {
        setError("NO NEURAL DIAGRAM GENERATED - CHECK QUANTUM RESPONSE");
      }
    } catch (err) {
      console.error("Neural generation error:", err);
      
      if (err.code === 'ECONNABORTED') {
        setError("NEURAL TIMEOUT - QUANTUM INTERFERENCE DETECTED");
      } else if (err.response?.status === 429) {
        setError("NEURAL OVERLOAD - RATE LIMIT EXCEEDED");
      } else if (err.response?.status >= 500) {
        setError("QUANTUM SERVER ERROR - NEURAL GRID UNSTABLE");
      } else if (err.response?.status === 404) {
        setError("NEURAL ENDPOINT NOT FOUND - CHECK QUANTUM CONFIGURATION");
      } else {
        setError(err.response?.data?.message || err.message || "NEURAL SYNTHESIS FAILED");
      }
      
      setRaw(JSON.stringify(err.response?.data, null, 2) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportPNG = async () => {
    const exportContainer = exportRef.current;
    if (!exportContainer || !mermaidCode.trim()) {
      setError("NO NEURAL DATA TO EXPORT");
      return;
    }

    setIsExporting(true);
    setError("");

    try {
      // Ensure fonts are loaded
      await document.fonts.ready;
      
      // Make export container visible and properly positioned for capture
      exportContainer.style.position = 'fixed';
      exportContainer.style.top = '50px';
      exportContainer.style.left = '50px';
      exportContainer.style.width = '1000px';
      exportContainer.style.height = '700px';
      exportContainer.style.zIndex = '9999';
      exportContainer.style.background = '#000000';
      exportContainer.style.padding = '40px';
      exportContainer.style.display = 'flex';
      exportContainer.style.alignItems = 'center';
      exportContainer.style.justifyContent = 'center';
      exportContainer.style.visibility = 'visible';
      exportContainer.className = 'export-container';
      
      // Wait for any layout changes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the SVG from the export container
      const exportSvg = exportContainer.querySelector('svg');
      if (exportSvg) {
        // Ensure SVG has proper styling for export
        exportSvg.style.background = '#000000';
        exportSvg.style.fontFamily = "'Orbitron', 'Courier New', Arial, sans-serif";
        
        // Fix all text elements
        const allTexts = exportSvg.querySelectorAll('text, tspan');
        allTexts.forEach(text => {
          text.style.fontFamily = "'Orbitron', 'Courier New', Arial, sans-serif";
          text.style.fontWeight = '600';
          text.style.fontSize = '14px';
          
          // Ensure text is visible
          const currentFill = text.getAttribute('fill');
          if (!currentFill || currentFill === 'none' || currentFill === 'transparent' || currentFill === 'currentColor') {
            text.setAttribute('fill', '#00ffff');
            text.style.fill = '#00ffff';
          }
        });
        
        // Export options optimized for visibility
        const options = {
          cacheBust: true,
          backgroundColor: '#000000',
          quality: 1.0,
          pixelRatio: 2,
          width: 1000,
          height: 700,
          skipFonts: false,
          useCORS: true,
          allowTaint: false,
          style: {
            fontFamily: "'Orbitron', 'Courier New', Arial, sans-serif",
            fontSize: '14px',
            fontWeight: '600'
          }
        };

        const dataUrl = await toPng(exportContainer, options);
        
        // Download the image
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${topic.trim().replace(/[^a-zA-Z0-9]/g, '_') || "neural_diagram"}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        alert('PNG export complete!');
        
      } else {
        throw new Error("No SVG found in export container");
      }
    } catch (err) {
      console.error("Quantum export error:", err);
      setError("QUANTUM EXPORT FAILED: " + err.message);
    } finally {
      setIsExporting(false);
      
      // Hide export container again after export
      const exportContainer = exportRef.current;
      if (exportContainer) {
        exportContainer.style.position = 'fixed';
        exportContainer.style.top = '-3000px';
        exportContainer.style.left = '-3000px';
        exportContainer.style.visibility = 'hidden';
        exportContainer.style.zIndex = '-1';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      generate();
    }
  };

  const clearAll = () => {
    setTopic("");
    setRaw("");
    setMermaidCode("");
    setError("");
    
    const emptyContent = `
      <div class="flex items-center justify-center h-full">
        <div class="text-center space-y-4">
          <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-400/30 neon-glow-cyan">
            <svg class="w-10 h-10 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <p class="text-cyan-300 font-semibold text-lg cyber-font">NEURAL GRID OFFLINE</p>
          <p class="text-cyan-500/70 text-sm font-mono">Initialize quantum diagram to activate</p>
        </div>
      </div>
    `;
    
    const container = previewRef.current;
    const exportContainer = exportRef.current;
    if (container) container.innerHTML = emptyContent;
    if (exportContainer) exportContainer.innerHTML = emptyContent;
    
    renderIdRef.current = 0;
  };

  const loadExample = () => {
    const exampleCode = `graph TD;
    A["⚡ QUANTUM START"] --> B{"🔮 Neural Processing"}
    B -->|"✨ Data Valid"| C["🚀 Execute"]
    B -->|"⚠️ Error Detected"| D["🔧 Debug Protocol"]
    D --> B
    C --> E["🧠 AI Analysis"]
    E --> F{"💎 Quality Gate"}
    F -->|"✅ Approved"| G["🌟 Deploy"]
    F -->|"❌ Failed"| H["🔄 Optimize"]
    H --> E
    G --> I["📡 Monitor"]
    I --> J["🎯 Success"]
    
    style A fill:#0a0a0a,stroke:#00ffff,stroke-width:3px,color:#00ffff
    style J fill:#0a0a0a,stroke:#00ff00,stroke-width:3px,color:#00ff00
    style B fill:#0a0a0a,stroke:#ff00ff,stroke-width:3px,color:#ff00ff
    style F fill:#0a0a0a,stroke:#ffff00,stroke-width:3px,color:#ffff00
    style D fill:#0a0a0a,stroke:#ff0066,stroke-width:3px,color:#ff0066`;
    
    setMermaidCode(exampleCode);
    setTopic("Quantum Neural Processing Pipeline");
  };

  // Update both preview and export containers when mermaidCode changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updatePreview(mermaidCode);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [mermaidCode, updatePreview]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Custom CSS for neon effects */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        
        .cyber-font {
          font-family: 'Orbitron', monospace;
          letter-spacing: 0.05em;
        }
        
        .tech-font {
          font-family: 'Rajdhani', sans-serif;
        }
        
        .neon-glow-cyan {
          box-shadow: 
            0 0 5px rgba(0, 255, 255, 0.5),
            0 0 20px rgba(0, 255, 255, 0.3), 
            0 0 40px rgba(0, 255, 255, 0.1), 
            inset 0 0 20px rgba(0, 255, 255, 0.05);
        }
        
        .neon-glow-purple {
          box-shadow: 
            0 0 5px rgba(255, 0, 255, 0.5),
            0 0 20px rgba(255, 0, 255, 0.3), 
            0 0 40px rgba(255, 0, 255, 0.1), 
            inset 0 0 20px rgba(255, 0, 255, 0.05);
        }
        
        .neon-glow-red {
          box-shadow: 
            0 0 5px rgba(255, 0, 102, 0.5),
            0 0 20px rgba(255, 0, 102, 0.3), 
            0 0 40px rgba(255, 0, 102, 0.1);
        }
        
        .neon-glow-green {
          box-shadow: 
            0 0 5px rgba(0, 255, 102, 0.5),
            0 0 20px rgba(0, 255, 102, 0.3), 
            0 0 40px rgba(0, 255, 102, 0.1);
        }
        
        .neon-glow-yellow {
          box-shadow: 
            0 0 5px rgba(255, 255, 0, 0.5),
            0 0 20px rgba(255, 255, 0, 0.3), 
            0 0 40px rgba(255, 255, 0, 0.1);
        }
        
        .holographic-bg {
          background: linear-gradient(45deg, 
            rgba(0, 255, 255, 0.1), 
            rgba(255, 0, 255, 0.1), 
            rgba(0, 255, 255, 0.1),
            rgba(255, 0, 255, 0.1)
          );
          background-size: 400% 400%;
          animation: holographic 8s ease-in-out infinite;
        }
        
        @keyframes holographic {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .neural-grid {
          background-image: 
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-flow 20s linear infinite;
        }
        
        @keyframes grid-flow {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          80%, 100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        
        .animation-delay-75 {
          animation-delay: 0.075s;
        }
        
        .animation-delay-150 {
          animation-delay: 0.15s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .cyber-border {
          background: linear-gradient(45deg, transparent, rgba(0, 255, 255, 0.5), transparent);
          padding: 2px;
          border-radius: 18px;
        }
        
        .cyber-border-inner {
          background: rgba(0, 0, 0, 0.8);
          border-radius: 16px;
        }
        
        .glitch-effect {
          animation: glitch 2s infinite;
        }
        
        @keyframes glitch {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        
        .data-stream {
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.5), transparent);
          background-size: 200% 100%;
          animation: data-flow 3s linear infinite;
        }
        
        @keyframes data-flow {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .matrix-rain {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 98px,
            rgba(0, 255, 255, 0.03) 100px
          );
          animation: matrix-fall 10s linear infinite;
        }
        
        @keyframes matrix-fall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        /* Export-specific styles */
        .export-container {
          background: #000000 !important;
          font-family: 'Orbitron', 'Courier New', Arial, sans-serif !important;
        }
        
        .export-container svg {
          background: #000000 !important;
          font-family: 'Orbitron', 'Courier New', Arial, sans-serif !important;
        }
        
        .export-container svg text {
          font-family: 'Orbitron', 'Courier New', Arial, sans-serif !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          fill: #00ffff !important;
        }
        
        .export-container svg tspan {
          font-family: 'Orbitron', 'Courier New', Arial, sans-serif !important;
          font-weight: 600 !important;
          fill: #00ffff !important;
        }
      `}</style>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 neural-grid opacity-20"></div>
      <div className="matrix-rain opacity-30"></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-conic from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-spin" style={{animationDuration: '20s'}}></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-conic from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-full blur-3xl animate-spin" style={{animationDuration: '30s'}}></div>
        
        {/* Floating quantum particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-70 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-4 bg-black/50 backdrop-blur-xl rounded-3xl px-8 py-6 border border-cyan-500/30 neon-glow-cyan mb-6">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-2xl border border-cyan-400/50 animate-ping"></div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent cyber-font">
                  NEURAL MIND AI
                </h1>
                <p className="text-cyan-300/80 text-sm font-mono">QUANTUM DIAGRAM SYNTHESIS ENGINE</p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 max-w-2xl mx-auto">
              <div className="bg-red-500/10 backdrop-blur-xl border border-red-400/30 rounded-2xl p-4 neon-glow-red">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center border border-red-400/30">
                    <svg className="w-5 h-5 text-red-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <p className="text-red-300 font-bold tech-font">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Input Section */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="cyber-border neon-glow-cyan">
              <div className="cyber-border-inner p-8">
                <label className="block text-sm font-bold text-cyan-300 mb-4 cyber-font">
                  ⚡ NEURAL INPUT INTERFACE
                </label>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      className="w-full px-6 py-4 bg-black/50 border border-cyan-500/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm placeholder-cyan-500/50 text-cyan-100 font-mono neon-glow-cyan"
                      placeholder="Initialize neural pathway: 'Quantum authentication matrix', 'AI decision tree', 'Data flow protocol'"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-500/50 font-mono text-sm">
                      {topic.length > 0 && `[${topic.length}]`}
                    </div>
                  </div>
                  <button
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black rounded-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 neon-glow-cyan hover:scale-105 cyber-font"
                    onClick={generate}
                    disabled={loading || !topic.trim()}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black"></div>
                          <div className="absolute inset-0 animate-spin rounded-full h-5 w-5 border-2 border-purple-600/30 border-t-purple-600 animation-delay-75"></div>
                        </div>
                        <span>SYNTHESIZING</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        <span>GENERATE</span>
                      </div>
                    )}
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <button
                    className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors duration-300 cyber-font flex items-center space-x-2 hover:scale-105"
                    onClick={loadExample}
                  >
                    <span>⚡</span>
                    <span>LOAD QUANTUM SAMPLE</span>
                  </button>
                  <button
                    className="text-purple-400 hover:text-purple-300 transition-colors duration-300 cyber-font flex items-center space-x-2 hover:scale-105"
                    onClick={clearAll}
                  >
                    <span>🔄</span>
                    <span>RESET NEURAL GRID</span>
                  </button>
                  <span className="text-cyan-500/60 font-mono flex items-center space-x-2">
                    <span>💡</span>
                    <span>CTRL+ENTER TO ACTIVATE</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Code Editor */}
            <div className="cyber-border neon-glow-purple">
              <div className="cyber-border-inner overflow-hidden">
                <div className="p-6 border-b border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-purple-300 flex items-center space-x-3 cyber-font">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                      </svg>
                      <span>NEURAL CODE MATRIX</span>
                    </h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse neon-glow-green"></div>
                      <span className="text-xs text-green-400 font-bold tech-font">QUANTUM SYNC ACTIVE</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="relative">
                    <textarea
                      className="w-full h-80 p-4 bg-black/60 border border-purple-500/30 rounded-2xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 resize-none transition-all duration-300 backdrop-blur-sm text-purple-100 placeholder-purple-500/50 neon-glow-purple"
                      value={mermaidCode}
                      onChange={(e) => setMermaidCode(e.target.value)}
                      placeholder="🧠 Neural diagram code materializes here... or input custom quantum syntax"
                      spellCheck={false}
                    />
                    {mermaidCode && (
                      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl px-4 py-2 text-xs text-cyan-400 border border-cyan-500/30 font-mono">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                          <span>{mermaidCode.split('\n').length} LINES • {mermaidCode.length} BYTES</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4 mt-6">
                    <button
                      className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-cyan-300 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-50 neon-glow-cyan cyber-font border border-cyan-500/30 hover:scale-105"
                      onClick={() => updatePreview(mermaidCode)}
                      disabled={!mermaidCode.trim()}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      <span>REFRESH MATRIX</span>
                    </button>
                    
                    <button
                      className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-black rounded-xl text-sm font-black disabled:opacity-50 transition-all duration-300 neon-glow-green cyber-font hover:scale-105"
                      onClick={exportPNG}
                      disabled={!previewRef.current?.querySelector("svg") || isExporting}
                    >
                      {isExporting ? (
                        <>
                          <div className="relative">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black"></div>
                            <div className="absolute inset-0 animate-spin rounded-full h-5 w-5 border-2 border-cyan-600/30 border-t-cyan-600 animation-delay-75"></div>
                          </div>
                          <span>QUANTUM EXPORT...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <span>EXPORT HOLOGRAM</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="cyber-border neon-glow-cyan">
              <div className="cyber-border-inner overflow-hidden">
                <div className="p-6 border-b border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-cyan-300 flex items-center space-x-3 cyber-font">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      <span>HOLOGRAPHIC DISPLAY</span>
                    </h3>
                    {mermaidCode && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse neon-glow-green"></div>
                        <span className="text-xs text-green-400 font-bold tech-font">NEURAL LINK ACTIVE</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <div
                    ref={previewRef}
                    className="h-80 bg-black/40 rounded-2xl border border-cyan-500/20 overflow-auto backdrop-blur-sm holographic-bg relative"
                    style={{ minHeight: '320px' }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-400/30 neon-glow-cyan">
                          <svg className="w-10 h-10 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                          </svg>
                        </div>
                        <p className="text-cyan-300 font-semibold text-lg cyber-font">NEURAL GRID OFFLINE</p>
                        <p className="text-cyan-500/70 text-sm font-mono">Initialize quantum diagram to activate</p>
                      </div>
                    </div>
                    
                    {/* Scanning line effect */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent data-stream"></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-cyan-400/60 text-center font-mono">
                    <div className="flex items-center justify-center space-x-4">
                      <span>⚡ QUANTUM SYNC ENABLED</span>
                      <span>•</span>
                      <span>🔮 HOLOGRAPHIC EXPORT READY</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Response */}
          {raw && (
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="cyber-border neon-glow-purple">
                <div className="cyber-border-inner overflow-hidden">
                  <details className="group">
                    <summary className="cursor-pointer p-6 hover:bg-purple-500/10 transition-all duration-300 border-b border-purple-500/20 group-open:border-b-0">
                      <div className="flex items-center space-x-4">
                        <svg className="w-6 h-6 text-purple-400 transition-transform duration-300 group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        <h4 className="text-xl font-black text-purple-300 cyber-font">NEURAL RESPONSE LOG</h4>
                        <span className="text-sm text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full font-mono border border-purple-500/30">RAW_DATA</span>
                        <div className="flex-1"></div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-purple-400 font-mono">DECODED</span>
                        </div>
                      </div>
                    </summary>
                    <div className="p-6">
                      <div className="bg-black/60 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm neon-glow-purple">
                        <pre className="whitespace-pre-wrap text-sm text-purple-200 max-h-64 overflow-auto font-mono">
                          {raw}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Tips Section */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="cyber-border neon-glow-cyan">
              <div className="cyber-border-inner p-8">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                    </div>
                    <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 animate-ping"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-black text-cyan-300 mb-6 cyber-font">⚡ NEURAL OPTIMIZATION PROTOCOLS</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20 neon-glow-cyan">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 animate-pulse"></div>
                            <div>
                              <p className="text-cyan-300 font-bold text-sm cyber-font">PRECISION TARGETING</p>
                              <p className="text-cyan-400/80 text-sm tech-font">"Quantum user authentication matrix" , "basic login flow"</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-purple-500/20 neon-glow-purple">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 animate-pulse"></div>
                            <div>
                              <p className="text-purple-300 font-bold text-sm cyber-font">DECISION PROTOCOLS</p>
                              <p className="text-purple-400/80 text-sm tech-font">Include error handlers, loops, and quantum conditions</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-pink-500/20 neon-glow-red">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 animate-pulse"></div>
                            <div>
                              <p className="text-pink-300 font-bold text-sm cyber-font">NEURAL EXAMPLES</p>
                              <p className="text-pink-400/80 text-sm tech-font">"AI processing pipeline", "Blockchain validation flow"</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-xl p-4 border border-green-500/20 neon-glow-green">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 animate-pulse"></div>
                            <div>
                              <p className="text-green-300 font-bold text-sm cyber-font">REAL-TIME SYNC</p>
                              <p className="text-green-400/80 text-sm tech-font">Neural grid updates instantly with code changes</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-yellow-500/20 neon-glow-yellow">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 animate-pulse"></div>
                            <div>
                              <p className="text-yellow-300 font-bold text-sm cyber-font">HOLOGRAPHIC EXPORT</p>
                              <p className="text-yellow-400/80 text-sm tech-font">Download high-resolution quantum diagrams</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-blue-500/20">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 animate-pulse"></div>
                            <div>
                              <p className="text-blue-300 font-bold text-sm cyber-font">MERMAID SYNTAX</p>
                              <p className="text-blue-400/80 text-sm tech-font">Direct neural code editing for advanced styling</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-4 text-cyan-400/60 text-sm font-mono">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span>QUANTUM AI POWERED</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-150"></div>
                <span>REACT NEURAL FRAMEWORK</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse animation-delay-300"></div>
                <span>MERMAID SYNTHESIS ENGINE</span>
              </div>
            </div>
            
            {/* Status indicators */}
            <div className="mt-6 flex justify-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse neon-glow-green"></div>
                <span className="text-green-400 text-xs font-bold tech-font">NEURAL GRID ONLINE</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse neon-glow-cyan"></div>
                <span className="text-cyan-400 text-xs font-bold tech-font">QUANTUM SYNC ACTIVE</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse neon-glow-purple"></div>
                <span className="text-purple-400 text-xs font-bold tech-font">HOLOGRAM READY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export container - hidden by default but becomes visible during export */}
      <div 
        ref={exportRef}
        className="export-container"
        style={{ 
          position: 'fixed',
          top: '-3000px',
          left: '-3000px',
          width: '1000px',
          height: '700px',
          background: '#000000',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Orbitron', 'Courier New', Arial, sans-serif",
          visibility: 'hidden',
          zIndex: '-1'
        }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-400/30 neon-glow-cyan">
              <svg className="w-10 h-10 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <p className="text-cyan-300 font-semibold text-lg cyber-font">NEURAL GRID OFFLINE</p>
            <p className="text-cyan-500/70 text-sm font-mono">Initialize quantum diagram to activate</p>
          </div>
        </div>
      </div>
    </div>
  );
}