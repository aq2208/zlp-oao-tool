import { useState } from 'react'
import type { MainConfiguration } from '../../types'

interface PhonePreviewProps {
  config: MainConfiguration
}

/* ── Tiny inline HTML renderer (safe for our own rich text) ── */
function RichContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={`prose prose-xs max-w-none text-[11px] leading-snug ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html || '<span style="color:#94a3b8">Chưa có nội dung...</span>' }}
    />
  )
}

/* ── Placeholder image ── */
function ImgPlaceholder({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  if (src) {
    return <img src={src} alt={alt ?? ''} className={`object-cover ${className ?? ''}`} onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x120/e2e8f0/94a3b8?text=Image' }} />
  }
  return (
    <div className={`bg-surface-100 flex items-center justify-center text-ink-300 text-[9px] font-medium ${className ?? ''}`}>
      No image
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Tab 1: Card View — mô phỏng cách card hiển thị trong list OAO
   ═══════════════════════════════════════════════════════════════ */
const HERO_HEIGHT = 325

function CardView({ config, onNavigate }: { config: MainConfiguration; onNavigate: (tab: 'detail' | 'landing') => void }) {
  const [freezeVisible, setFreezeVisible] = useState(false)
  const card = config.base_card
  const hero = config.hero_banner
  const explored = config.explored_card
  const cta = config.cta_list[0]

  const cardBg = card.bg_transparent ? 'transparent' : card.bg_color || '#1d4ed8'

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setFreezeVisible(e.currentTarget.scrollTop >= HERO_HEIGHT)
  }

  return (
    <div className="flex flex-col h-full relative">

      {/* Freeze Banner — overlaid at top, appears only after hero scrolls away */}
      {config.freeze_banner.enabled && freezeVisible && (
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 px-3 py-2 border-b border-white/20"
          style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        >
          <div className="w-8 h-8 rounded-lg bg-white/40 shrink-0 overflow-hidden">
            <ImgPlaceholder src={hero.image_url} alt="" className="w-full h-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-ink-900 truncate">{config.freeze_banner.title || '—'}</p>
            <p className="text-[9px] text-ink-500 truncate">{config.freeze_banner.subtitle}</p>
          </div>
          {cta && (
            <button className="shrink-0 text-[9px] font-bold text-white px-2 py-1 rounded-full" style={{ backgroundColor: '#2563eb' }}>
              {cta.button_name || 'Mở ngay'}
            </button>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain bg-[#f5f7fa]" onScroll={handleScroll}>

        {/* Hero Banner — full-height image with gradient text overlay at bottom */}
        {hero.enabled && (
          <div className="relative w-full overflow-hidden z-10 cursor-pointer" style={{ height: 325, boxShadow: '0 6px 20px rgba(0,0,0,0.14)' }} onClick={() => onNavigate('detail')}>
            {hero.image_url ? (
              <img
                src={hero.image_url}
                alt="hero"
                className="w-full h-full object-cover object-top"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/235x325/1d4ed8/ffffff?text=Hero+Banner' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-white/60 text-[10px]">Hero Banner Image</span>
              </div>
            )}
            {/* Gradient strip — transparent → white, just enough for title + subtitle */}
            {(hero.title || hero.subtitle) && (
              <div
                className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end px-4 pt-8 pb-2.5"
                style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0.96) 100%)' }}
              >
                {hero.title && (
                  <p className="text-[11px] font-bold leading-tight text-center" style={{ color: hero.title_color === '#ffffff' ? '#111827' : (hero.title_color || '#111827') }}>
                    {hero.title}
                  </p>
                )}
                {hero.subtitle && (
                  <p className="text-[9px] leading-tight text-center mt-0.5" style={{ color: hero.subtitle_color === '#ffffff' ? '#6b7280' : (hero.subtitle_color || '#6b7280') }}>
                    {hero.subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Card list section */}
        <div className="px-2 pt-2 pb-4 space-y-3">
          <p className="text-[12px] font-bold text-ink-900">Khám phá dịch vụ</p>

          {/* Partner Card */}
          <div
            className="relative rounded-xl shadow-md cursor-pointer"
            style={{
              backgroundColor: cardBg,
              backgroundImage: card.bg_image_url ? `url(${card.bg_image_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={() => onNavigate('detail')}
          >
            {/* Top-right badge — hugs the card's top-right corner */}
            {explored.badge && (
              <div className="absolute top-0 right-0 z-10">
                <span className="text-[8px] font-bold text-white px-2 py-0.5 leading-tight block" style={{ backgroundColor: '#ef4444', borderRadius: '0 12px 0 8px' }}>
                  {explored.badge}
                </span>
              </div>
            )}

            {/* Top-right shape/watermark */}
            {card.top_right_shape_url && (
              <img
                src={card.top_right_shape_url}
                alt=""
                className="absolute top-1 right-1 object-contain opacity-40 z-10 pointer-events-none"
                style={{ width: 44, height: 44 }}
              />
            )}

            <div className="px-2.5 pt-2.5 pb-2.5 relative z-20">
              {/* Logo + title row */}
              <div className="flex items-start gap-1.5 mb-1.5">
                {/* Logo in white rounded box */}
                <div className="w-7 h-7 rounded-lg bg-white shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                  {card.logo_left_url ? (
                    <img
                      src={card.logo_left_url}
                      alt="logo"
                      className="w-full h-full object-contain p-0.5"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <span className="text-[6px] font-bold text-ink-400">{config.bank_code?.slice(0, 5)}</span>
                  )}
                </div>
                {/* Title + subtitle */}
                <div className="flex-1 min-w-0" style={{ paddingRight: explored.badge || card.top_right_shape_url ? 52 : 0 }}>
                  {card.title && (
                    <p className="text-[9px] font-bold leading-tight truncate" style={{ color: card.title_color || '#fff' }}>
                      {card.title}
                    </p>
                  )}
                  {card.subtitle && (
                    <p className="text-[8px] mt-0.5 leading-tight truncate" style={{ color: card.subtitle_color || '#e2e8f0' }}>
                      {card.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Benefits + CTA button */}
              <div className="flex items-end gap-1.5">
                <div className="flex-1 min-w-0" style={{ color: card.content_color || '#ffffff' }}>
                  {explored.enabled && explored.description && (
                    <RichContent
                      html={explored.description}
                      className="[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-0 [&_li]:text-[9px] [&_li]:leading-snug [&_li]:mb-px [&_li]:text-current [&_li::marker]:text-current"
                    />
                  )}
                </div>
                {cta && (
                  <button
                    className="shrink-0 text-[9px] font-bold text-white px-2.5 py-1.5 rounded-full shadow-md whitespace-nowrap"
                    style={{ backgroundColor: '#2563eb' }}
                    onClick={(e) => { e.stopPropagation(); onNavigate('landing') }}
                  >
                    {cta.button_name || 'Mở ngay'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Ghost placeholder cards */}
          {[
            { color: '#fce4ec', label: 'Vay tiêu dùng', sub: 'TINVAY', badge: 'Lãi suất 0%' },
            { color: '#e8f5e9', label: 'Vay nhanh', sub: 'F88', badge: 'Vay 2 tỷ đồng' },
            { color: '#fff3e0', label: 'Bảo hiểm nhân thọ', sub: 'Manulife', badge: 'Ưu đãi 20%' },
            { color: '#e3f2fd', label: 'Mở tài khoản', sub: 'MSB', badge: 'Tặng 100K' },
            { color: '#fce4ec', label: 'Thẻ ghi nợ', sub: 'TCB', badge: 'Miễn phí năm đầu' },
          ].map((ghost) => (
            <div key={ghost.label} className="relative rounded-xl shadow-sm opacity-70" style={{ backgroundColor: ghost.color }}>
              <div className="absolute top-0 right-0 z-10">
                <span className="text-[8px] font-bold text-white px-1.5 py-0.5 leading-tight block" style={{ backgroundColor: '#6b7280', borderRadius: '0 12px 0 8px' }}>{ghost.badge}</span>
              </div>
              <div className="px-2.5 pt-2.5 pb-2.5">
                <div className="flex items-start gap-1.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-white shadow-sm shrink-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-surface-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold leading-tight text-ink-700 truncate">{ghost.label}</p>
                    <p className="text-[8px] mt-0.5 text-ink-400 truncate">{ghost.sub}</p>
                  </div>
                </div>
                <div className="flex items-end gap-1.5">
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 bg-black/10 rounded w-4/5" />
                    <div className="h-1.5 bg-black/10 rounded w-3/5" />
                    <div className="h-1.5 bg-black/10 rounded w-4/5" />
                  </div>
                  <div className="shrink-0 text-[9px] font-bold text-white px-2.5 py-1.5 rounded-full bg-surface-300 whitespace-nowrap">Mở ngay</div>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Tab 2: Detail Block — mô phỏng Trang 2 (quyền lợi + điều kiện)
   ═══════════════════════════════════════════════════════════════ */
function DetailView({ config, onNavigate }: { config: MainConfiguration; onNavigate: (tab: 'landing') => void }) {
  const block = config.detail_block

  if (!block.enabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-2 bg-white">
        <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <p className="text-[10px] text-ink-400 font-medium">Trang 2 đang tắt</p>
        <p className="text-[9px] text-ink-300">Flow sẽ bỏ qua trang này<br />và chuyển thẳng sang Trang 3</p>
      </div>
    )
  }

  const richCls = '[&_h2]:text-[12px] [&_h2]:font-bold [&_h2]:text-ink-900 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mt-1 [&_li]:text-[10px] [&_li]:leading-snug [&_li]:text-ink-900 [&_li]:mb-1 [&_li::marker]:text-ink-900'

  return (
    <div className="h-full bg-[#f5f7fa] px-2 pt-2 pb-6 flex flex-col">
      {/* Vertical card — pb-6 leaves visible gap at bottom of phone */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Top image — fixed height = ~1/4 of card */}
          {block.top_image_url ? (
            <img src={block.top_image_url} alt="detail" className="w-full object-cover" style={{ height: 110 }}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/235x110/e2e8f0/94a3b8?text=Top+Image' }} />
          ) : (
            <div className="w-full flex items-center justify-center bg-surface-100" style={{ height: 110 }}>
              <span className="text-[9px] text-ink-300">Top Image chưa nhập</span>
            </div>
          )}

          {/* Content primary */}
          <div className="px-3 pt-3 pb-2">
            {block.content_primary
              ? <RichContent html={block.content_primary} className={richCls} />
              : <span className="text-[9px] text-ink-300">Content Primary chưa nhập...</span>}
          </div>

          {/* Divider */}
          {block.content_secondary && <div className="mx-3 border-t border-surface-200" />}

          {/* Content secondary */}
          {block.content_secondary && (
            <div className="px-3 pt-3 pb-2">
              <RichContent html={block.content_secondary} className={richCls} />
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* CTA — pill, centered, narrower than full width */}
        {config.cta_list.length > 0 && (
          <div className="shrink-0 px-6 pb-3 pt-2">
            <button
              className="w-full py-2.5 rounded-full text-[12px] font-bold text-white"
              style={{ backgroundColor: config.base_card.bg_color || '#1d4ed8' }}
              onClick={() => onNavigate('landing')}
            >
              {config.cta_list[0].button_name || 'Mở ngay'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Tab 3: Landing Page — mô phỏng Trang 3 (partner content)
   ═══════════════════════════════════════════════════════════════ */
function LandingView({ config }: { config: MainConfiguration }) {
  return (
    <div className="flex flex-col h-full bg-[#f5f7fa]">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-3 pt-10 pb-2 space-y-3">

          {/* Header + content merged into one connected card */}
          <div className="rounded-2xl overflow-hidden shadow-sm">
            {/* Header — gradient from saturated blue to white */}
            <div
              className="px-4 py-4 flex flex-col items-center gap-2"
              style={{ background: 'linear-gradient(to bottom, #93c5fd, #ffffff)' }}
            >
              {config.header_image_url ? (
                <img src={config.header_image_url} alt="logo" className="h-6 object-contain max-w-[120px]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <div className="h-6 w-20 bg-blue-100 rounded flex items-center justify-center text-[8px] text-blue-300">Logo</div>
              )}
              <p className="text-[12px] font-bold text-ink-900 text-center leading-snug">
                {config.header_title || <span className="text-ink-300">Tiêu đề chưa nhập...</span>}
              </p>
            </div>
            {/* Main content — white, flows directly below header */}
            <div className="bg-white px-3 pb-3">
              <RichContent
                html={config.main_content}
                className="[&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:text-ink-900 [&_h2]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mt-1 [&_li]:text-[9px] [&_li]:leading-snug [&_li]:text-ink-900 [&_li]:mb-0.5 [&_li::marker]:text-ink-900"
              />
            </div>
          </div>

          {/* Steps — horizontal scrollable row */}
          {config.guidances.length > 0 && (
            <div className="overflow-x-auto -mx-3 px-3">
              <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
                {config.guidances.map((g) => (
                  <div key={g.id} className="bg-white rounded-xl overflow-hidden flex flex-col shrink-0" style={{ width: 140 }}>
                    <div className="px-2.5 pt-2.5 pb-1">
                      <p className="text-[10px] font-bold text-ink-900">Bước {g.order}</p>
                      <p className="text-[8px] text-ink-900 leading-tight mt-0.5 line-clamp-2">{g.content || '—'}</p>
                    </div>
                    <div className="overflow-hidden">
                      <ImgPlaceholder src={g.image_url} alt={`step ${g.order}`} className="w-full h-[170px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub content links */}
          {config.sub_content_list.length > 0 && (
            <div className="space-y-1.5">
              {config.sub_content_list.map((sc) => (
                <div key={sc.id} className="flex items-center gap-1.5 text-[9px] text-ink-900">
                  <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {sc.label || sc.zpa_link}
                </div>
              ))}
            </div>
          )}

          <div className="h-2" />
        </div>
      </div>

      {/* Sticky CTA */}
      {config.cta_list.length > 0 && (
        <div className="shrink-0 px-3 py-2.5 bg-white border-t border-surface-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <button
            className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white"
            style={{ backgroundColor: config.base_card.bg_color || '#1d4ed8' }}
          >
            {config.cta_list[0].button_name || 'Mở ngay'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Phone frame wrapper
   ═══════════════════════════════════════════════════════════════ */
const TAB_LABELS: Record<string, string> = {
  card: 'Trang 1',
  detail: 'Trang 2',
  landing: 'Trang 3',
}

export function PhonePreview({ config }: PhonePreviewProps) {
  const [tab, setTab] = useState<'card' | 'detail' | 'landing'>('card')

  const showNavBar = false

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Tab switcher */}
      <div className="flex bg-surface-100 rounded-lg p-0.5 gap-0.5">
        {(['card', 'detail', 'landing'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              tab === t
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Phone frame — 19.5:9 aspect ratio (iPhone Pro Max) */}
      <div
        className="relative shadow-2xl overflow-hidden"
        style={{
          width: 235,
          height: 515,
          background: '#111',
          border: '6px solid #222',
          borderRadius: 44,
          boxShadow: '0 0 0 1px #444, inset 0 0 0 1px #000, 0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Dynamic Island */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 bg-black flex items-center justify-center"
          style={{ top: 6, width: 72, height: 18, borderRadius: 10 }}
        >
          <div className="w-2 h-2 rounded-full bg-[#1c1c1e]" style={{ boxShadow: 'inset 0 0 0 1px #2c2c2e' }} />
        </div>

        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 h-7 flex items-end justify-between px-5 pb-1 z-30">
          <span className="text-[8px] text-ink-900 font-semibold">23:44</span>
          <div className="flex items-center gap-0.5">
            <div className="flex gap-px items-end h-2.5">
              {[2, 3, 4, 4].map((h, i) => (
                <div key={i} className="w-1 rounded-sm bg-ink-700" style={{ height: h * 2 }} />
              ))}
            </div>
            <svg className="w-3 h-3 text-ink-700 mx-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.5 8.5a13 13 0 0121 0M5 12a10 10 0 0114 0M8.5 15.5a6 6 0 017 0M12 19h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" />
            </svg>
            <svg className="w-3.5 h-2.5 text-ink-700" viewBox="0 0 24 10" fill="none">
              <rect x="0.5" y="0.5" width="19" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
              <rect x="2" y="2" width="15" height="6" rx="1" fill="currentColor" opacity="0.8" />
              <path d="M21 3.5v3a1.5 1.5 0 000-3z" fill="currentColor" opacity="0.5" />
            </svg>
          </div>
        </div>

        {/* Screen background */}
        <div className="absolute inset-0 bg-[#f5f7fa]" />

        {/* Top nav bar — only for detail / landing tabs */}
        {showNavBar && (
          <div className="absolute top-7 left-0 right-0 h-9 flex items-center justify-between px-3 z-10 bg-white/80 backdrop-blur-sm border-b border-surface-100/60">
            <button className="w-5 h-5 text-ink-400" onClick={() => setTab(tab === 'landing' ? 'detail' : 'card')}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-[10px] font-semibold text-ink-700 truncate max-w-[120px]">
              {config.header_title || config.name || 'Chi tiết'}
            </span>
            <button className="w-5 h-5 text-ink-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Content area — starts right below status bar for card tab, below nav bar otherwise */}
        <div className={`absolute ${showNavBar ? 'top-16' : 'top-7'} left-0 right-0 bottom-0 overflow-hidden bg-[#f5f7fa]`}>
          {tab === 'card' && <CardView config={config} onNavigate={setTab} />}
          {tab === 'detail' && <DetailView config={config} onNavigate={setTab} />}
          {tab === 'landing' && <LandingView config={config} />}
        </div>

        {/* Floating close button — all tabs */}
        <div
          className="absolute top-7 right-3 z-40 flex items-center justify-center w-6 h-6 cursor-pointer"
          onClick={() => {
            if (tab === 'detail') setTab('card')
            else if (tab === 'landing') setTab(config.detail_block.enabled ? 'detail' : 'card')
          }}
        >
          <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

    </div>
  )
}
