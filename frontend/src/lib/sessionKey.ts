/**
 * A short unique id minted by whatever navigates to `/mentor?...`, carried
 * through as the `s` query param. MentorPage never removes it when it
 * clears its other URL params, and App.tsx keys the <MentorPage> element on
 * it — so navigating from one exercise/Mejora-block session straight into
 * another (same route, only the query string changes) forces a real remount
 * instead of silently reusing stale component state from the previous one.
 */
export function mintSessionId(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
