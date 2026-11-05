// GET /api/ai/status → { enabled, fixture, remaining }: lets the UI choose
// between the automatic path and the "Do it in Claude" hand-off up front.
import { authenticate } from '../_lib/auth.js';
import { aiEnabled, fixtureMode } from '../_lib/claude.js';
import { handle, json } from '../_lib/http.js';
import { remaining } from '../_lib/usage.js';

export const GET = handle(async (req) => {
  const { userId, admin } = await authenticate(req);
  return json({
    enabled: aiEnabled(),
    fixture: fixtureMode(),
    remaining: await remaining(admin, userId),
  });
});
