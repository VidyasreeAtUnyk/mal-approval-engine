// Re-exports from ProfileContext so all existing imports work unchanged.
// The actual fetch now happens once in ProfileProvider (app layout),
// shared across Header, Sidebar, NotificationBell, and RoleGuard.
export { useProfile } from '@/context/ProfileContext'
