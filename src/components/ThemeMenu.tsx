import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Monitor, Moon, Settings, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dropdown,
  DropdownLabel,
  DropdownSeparator,
} from '@/components/ui/dropdown'
import { MenuItem } from '@/components/ui/menu-item'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, type Theme } from '@/lib/theme'

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeMenu() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const checkedIndex = THEME_OPTIONS.findIndex((opt) => opt.value === theme)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Settings and theme"
        aria-expanded={open}
        active={open}
        className="min-h-10 min-w-10"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Settings className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52">
          <Dropdown checkedIndex={checkedIndex} className="w-full">
            <DropdownLabel>Settings & theme</DropdownLabel>
            <DropdownSeparator />
            {THEME_OPTIONS.map((opt, index) => (
              <MenuItem
                key={opt.value}
                index={index}
                icon={opt.icon}
                label={opt.label}
                checked={theme === opt.value}
                onSelect={() => {
                  setTheme(opt.value)
                  setOpen(false)
                }}
              />
            ))}
            <DropdownSeparator />
            <MenuItem
              index={3}
              label="App settings"
              onSelect={() => {
                setOpen(false)
                navigate('/settings')
              }}
            />
            <MenuItem
              index={4}
              label="Sign out"
              onSelect={() => {
                setOpen(false)
                void signOut()
              }}
            />
          </Dropdown>
        </div>
      )}
    </div>
  )
}
