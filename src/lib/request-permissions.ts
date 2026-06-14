/**
 * Pure business-rule functions extracted from route handlers.
 * Tested independently so route logic can be verified without HTTP overhead.
 */

/** Admin can act on any request; managers and employees are scoped to their own. */
export function requiresApproverFilter(role: string): boolean {
  return role !== 'admin'
}

/** Only pending or draft requests may be withdrawn by the requester. */
export function canWithdraw(status: string): boolean {
  return status === 'pending' || status === 'draft'
}

/** Only managers and admins may approve or reject. */
export function canReview(role: string): boolean {
  return role === 'manager' || role === 'admin'
}
