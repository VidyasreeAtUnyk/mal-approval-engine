import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mal Approval Engine'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f3a 50%, #0f0a1e 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: '#7C3AED',
            marginBottom: 32,
            fontSize: 42,
            color: 'white',
            fontWeight: 700,
          }}
        >
          مال
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-2px',
            marginBottom: 16,
          }}
        >
          Mal Approval Engine
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.6)',
            marginBottom: 48,
          }}
        >
          Config-driven · Multi-flow · Realtime
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['Budget Requests', 'Leave Requests', 'AI Summaries', 'Role-based Access'].map((label) => (
            <div
              key={label}
              style={{
                padding: '8px 20px',
                borderRadius: 9999,
                border: '1px solid rgba(124,58,237,0.5)',
                background: 'rgba(124,58,237,0.15)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 18,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          mal-approval-engine.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
