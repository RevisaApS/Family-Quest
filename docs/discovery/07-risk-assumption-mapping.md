# Phase 7: Risk & Assumption Mapping

## Executive Summary

| Risk Category | Count | Critical Risks |
|---------------|-------|----------------|
| Technical | 6 | AI content safety, Danish TTS quality |
| Regulatory | 3 | COPPA compliance (HIGH) |
| Market/Competitive | 4 | Giant ($8M), screen-light paradox |
| Business Model | 4 | TTS cost scaling |
| Execution | 3 | Solo developer capacity |
| **Total Risks** | **20** | **5 Critical** |

**Overall Assessment:** Risks are manageable but require deliberate mitigation. The COPPA compliance requirement is the most significant—you're building an app that collects data from children under 13 in the US, which triggers strict federal regulations.

---

## Risk Register

### CRITICAL RISKS (Must Address Before Launch)

#### R1: COPPA Compliance
| Attribute | Detail |
|-----------|--------|
| **Category** | Regulatory |
| **Severity** | CRITICAL |
| **Likelihood** | Certain (if you have US users under 13) |
| **Impact** | Fines up to $53,088 PER VIOLATION |

**Description:** COPPA (Children's Online Privacy Protection Act) applies to any commercial website or app that:
- Is directed at children under 13, OR
- Knowingly collects personal information from children under 13

Your app explicitly targets children aged 7-13. This triggers full COPPA compliance requirements.

**COPPA Requirements:**
1. **Verifiable Parental Consent** before collecting ANY child data
2. **Privacy Policy** specifically addressing children's data
3. **Data Minimization** - collect only what's necessary
4. **Parental Rights** - parents must be able to review/delete child data
5. **Security Measures** - protect children's data from unauthorized access
6. **7-Day Notice** - notify parents before material privacy policy changes
7. **No Conditioning** - can't require more data than needed for activity

**Consent Methods Accepted by FTC:**
- Signed consent form (mail/fax/scan)
- Credit card verification
- Phone call with trained personnel
- Video conference
- Knowledge-based authentication
- Facial recognition with government ID

**Mitigation:**
1. Implement "family account" model where PARENT creates account (adult email, payment)
2. Children are "players" under parent's account, not separate accounts
3. Minimize child data collection - no names, emails, or identifiers from children directly
4. Character names/data tied to parent account, not child identity
5. Use Supabase Row Level Security to ensure data isolation
6. Consult with COPPA-specialized attorney before US launch
7. Consider launching in Denmark first (GDPR applies, different requirements)

**Budget Impact:** Legal consultation ~$2,000-5,000 for COPPA review

---

#### R2: AI Content Safety for Children
| Attribute | Detail |
|-----------|--------|
| **Category** | Technical |
| **Severity** | CRITICAL |
| **Likelihood** | Medium-High (LLMs can produce unexpected outputs) |
| **Impact** | Reputation destruction, potential legal liability |

**Description:** LLMs can generate inappropriate content including:
- Violence beyond age-appropriate levels
- Scary/traumatic content
- Inappropriate relationships/situations
- Profanity or adult language
- Discriminatory or harmful stereotypes

**Real Example:** AI Dungeon faced major backlash when users reported the AI generating inappropriate content involving minors.

**Mitigation:**
1. **System Prompt Engineering:** Strong guardrails in system prompt
   ```
   You are a family-friendly storyteller for children aged 7-13.
   NEVER generate content involving:
   - Graphic violence or death descriptions
   - Scary content (horror, jump scares, nightmares)
   - Romantic relationships beyond friendship
   - Adult themes or innuendo
   - Profanity or crude language
   - Real-world violence or tragedy
   Always maintain a tone suitable for a Disney movie.
   ```
2. **Output Filtering:** Use Claude's built-in safety features + secondary moderation prompt
3. **Word Blocklist:** Hard filter for explicit terms
4. **"Tone Check" Layer:** Secondary Claude prompt to evaluate output before display
5. **Parental Preview:** Option for parents to see story before children
6. **Report Button:** Easy way for parents to flag inappropriate content
7. **Human Review Queue:** Manual review of flagged content

**Testing Requirement:** Red-team test extensively before launch with adversarial prompts.

---

#### R3: Danish TTS Quality
| Attribute | Detail |
|-----------|--------|
| **Category** | Technical |
| **Severity** | HIGH |
| **Likelihood** | Low (ElevenLabs Danish is good) |
| **Impact** | Core feature unusable for primary market |

**Description:** Your original frustration with Google AI Studio was Danish TTS quality. If ElevenLabs or alternatives don't deliver natural-sounding Danish, the core "audio-first" experience fails.

**Current Assessment:**
- ElevenLabs: Excellent Danish voices (tested, reviewed positively)
- Google Cloud TTS: Good Danish quality
- Azure Neural TTS: Good Danish quality
- Amazon Polly: Fair Danish quality

**Mitigation:**
1. Test ElevenLabs Danish voices with your twins BEFORE building
2. Record test phrases: adventure narration, character dialogue, emotional moments
3. Have backup: Google Cloud TTS as fallback
4. Design for graceful degradation: text display always visible alongside audio
5. Consider: Custom voice training if generic voices aren't engaging enough

**Validation Test:** Create 5-minute sample adventure narration, play for your twins, assess engagement.

---

### HIGH RISKS (Address in MVP)

#### R4: PWA iOS Audio Limitations
| Attribute | Detail |
|-----------|--------|
| **Category** | Technical |
| **Severity** | HIGH |
| **Likelihood** | Medium |
| **Impact** | Core feature degraded on iOS |

**Description:** iOS Safari has PWA limitations:
- Audio playback can be interrupted if screen dims
- Background audio doesn't work
- 7-day cache expiry clears stored data
- EU iOS users (17.4+) have degraded PWA experience

**Why This Matters Less For You:**
- "Screen-light" design = short audio segments, not continuous playback
- Family is actively engaged, not passive listening
- You're in Denmark (not EU iOS restrictions... wait, Denmark IS in the EU)

**EU Impact (IMPORTANT):** Denmark is in the EU. iOS 17.4+ in EU countries means:
- PWAs open in Safari tabs, not standalone
- No push notifications
- No app badges
- Browser chrome always visible

**Mitigation:**
1. Design for "tap to continue" flow - audio segments, not continuous playback
2. Keep audio segments short (30-60 seconds max)
3. Cache critical assets on every launch
4. Test extensively on iPhone (your primary test devices)
5. **Consider Capacitor wrapper** for iOS in EU to get native app benefits
6. Keep text always visible as backup to audio

**Decision Point:** EU PWA limitations may push you toward a Capacitor-wrapped iOS app sooner than planned.

---

#### R5: Competitive Threat - Giant
| Attribute | Detail |
|-----------|--------|
| **Category** | Market |
| **Severity** | HIGH |
| **Likelihood** | Medium |
| **Impact** | Market captured before you scale |

**Description:** Giant raised $8M seed funding (Feb 2026) for AI-powered interactive storytelling for children. They've passed 1 million minutes of conversation since May 2025 launch. They're well-funded, have traction, and target the same age group.

**Giant's Positioning:**
- Children become cartoon characters
- Design their own worlds
- Interactive storytelling (not D&D/RPG specific)
- Solo experience (not family multiplayer)

**Your Differentiation:**
| Feature | Giant | You |
|---------|-------|-----|
| D&D/RPG mechanics | No | Yes |
| Physical dice | No | Yes |
| Family multiplayer | No | Yes |
| Screen-light design | No | Yes |
| Parent as co-pilot | No | Yes |
| Danish language | Probably not | Yes |

**Mitigation:**
1. **Lean into differentiation:** Don't compete on "AI storytelling for kids" - compete on "Family D&D made magical"
2. **Speed to market:** Launch MVP in months, not years
3. **Nordic niche:** Own Denmark/Nordics where Giant likely won't prioritize
4. **Community moat:** Build community of family D&D players
5. **Watch closely:** Monitor Giant's feature roadmap

---

#### R6: Screen-Light Paradox
| Attribute | Detail |
|-----------|--------|
| **Category** | Business Model |
| **Severity** | HIGH |
| **Likelihood** | Medium |
| **Impact** | Value proposition unclear to users |

**Description:** You're building an app that discourages screen use. This creates tension:
- Less screen time = less perceived app value
- Parents might not "see" the app working
- Harder to demonstrate value for subscription

**Mitigation:**
1. **Reframe:** "The best screen time is screen time that brings you together"
2. **Session Summaries:** After each adventure, show recap of what happened
3. **Progress Tracking:** Character progression, achievements visible in app
4. **Adventure Journal:** Save story highlights, quotes, memorable moments
5. **Usage Stats for Parents:** "This week: 3 adventures, 2 hours of family time"
6. **Testimonial Focus:** Marketing shows families together, not staring at screens

---

#### R7: TTS Cost Scaling
| Attribute | Detail |
|-----------|--------|
| **Category** | Business Model |
| **Severity** | HIGH |
| **Likelihood** | High |
| **Impact** | Unit economics collapse at scale |

**Description:** TTS is your primary variable cost. ElevenLabs pricing:
- Starter: $5/mo for 30,000 characters
- Creator: $22/mo for 100,000 characters
- Pro: $99/mo for 500,000 characters

At ~20,000 characters per session, a heavy user (8 sessions/month) uses 160,000 characters.

**Cost Per User (Heavy Usage):**
- TTS: ~$35/month (at Creator rates)
- LLM: ~$5/month
- Images: ~$3/month
- **Total: ~$43/month per heavy user**

If subscription is $10/month, you LOSE $33/month on heavy users.

**Mitigation:**
1. **Usage Tiers:** Free tier has limited TTS; paid unlocks more
2. **Caching:** Cache common phrases, intro sequences
3. **Text Fallback:** Option to read instead of listen
4. **Negotiate Volume:** ElevenLabs enterprise pricing at scale
5. **Alternative Pricing:** Per-adventure credits instead of unlimited
6. **Parent Voice Recording:** Parents record their own narration (premium feature)

**Model Consideration:** Freemium may not work. Consider:
- Higher price point ($15-20/month)
- Per-adventure credits ($1-2 per adventure)
- Annual subscription discount

---

### MEDIUM RISKS

#### R8: Physical Dice UX
| Attribute | Detail |
|-----------|--------|
| **Category** | UX |
| **Severity** | MEDIUM |
| **Likelihood** | Medium |
| **Impact** | Core differentiator feels clunky |

**Description:** "Roll your dice and tell me what you got" could feel awkward:
- Interrupts story flow
- Voice input errors
- Kids might lie about rolls
- Friction in the magic moment

**Mitigation:**
1. Make dice moments EXCITING, not interruptions
   - "The dragon rears back... [dramatic pause] ...ROLL FOR INITIATIVE!"
2. Simple input: Big buttons for numbers, or voice "I rolled a 17"
3. Celebration animations for good rolls
4. Don't verify - trust the family, it's about fun not fairness
5. Optional: Camera dice reading (future feature)
6. Test with your twins - they'll tell you if it's fun or annoying

---

#### R9: GDPR Compliance (EU/Denmark)
| Attribute | Detail |
|-----------|--------|
| **Category** | Regulatory |
| **Severity** | MEDIUM |
| **Likelihood** | Certain (you're in Denmark) |
| **Impact** | Fines, but less strict than COPPA for children |

**Description:** GDPR applies in Denmark. For children:
- Denmark: Parental consent required under age 13
- Similar to COPPA but different mechanisms

**Mitigation:**
1. Parent-owned accounts (same as COPPA mitigation)
2. Clear privacy policy in Danish
3. Data minimization
4. Right to deletion
5. Supabase is GDPR compliant
6. Less prescriptive than COPPA - family account model likely sufficient

---

#### R10: LLM API Reliability
| Attribute | Detail |
|-----------|--------|
| **Category** | Technical |
| **Severity** | MEDIUM |
| **Likelihood** | Low-Medium |
| **Impact** | Adventure interrupted mid-session |

**Description:** Claude/Gemini APIs can have:
- Outages
- Rate limits
- Latency spikes
- Model changes affecting output quality

**Mitigation:**
1. Graceful error handling with friendly messages
2. Retry logic with exponential backoff
3. Multiple provider support (Claude primary, Gemini as backup)
4. Cache story context so recovery is possible
5. Offline mode for previously cached content

---

#### R11: Solo Developer Capacity
| Attribute | Detail |
|-----------|--------|
| **Category** | Execution |
| **Severity** | MEDIUM |
| **Likelihood** | High |
| **Impact** | Slow iteration, burnout |

**Description:** You're a PM learning to code, building this as a side project. Risks:
- Learning curve slows progress
- Bugs pile up faster than fixes
- Feature creep
- Burnout

**Mitigation:**
1. Ruthless MVP scoping - launch with MINIMUM features
2. Lovable for rapid prototyping, don't hand-code everything
3. Weekly milestones, not monthly
4. Test with twins early and often - they're your accountability
5. Set "good enough" bar for MVP
6. Consider contractor help for specific tasks (e.g., TTS integration)

---

#### R12: Payment Integration Complexity
| Attribute | Detail |
|-----------|--------|
| **Category** | Technical |
| **Severity** | MEDIUM |
| **Likelihood** | Medium |
| **Impact** | Delayed monetization |

**Description:** Accepting payments requires:
- Stripe/payment processor setup
- Subscription management
- Invoicing (especially for Danish VAT)
- Failed payment handling

**Mitigation:**
1. Use Stripe (works well with Supabase)
2. Start simple: one price tier
3. Consider Lemon Squeezy for simpler EU VAT handling
4. Launch free-only first, add payments after validation

---

### LOW RISKS

#### R13: Image Generation Quality
| Attribute | Detail |
|-----------|--------|
| **Category** | Technical |
| **Severity** | LOW |
| **Likelihood** | Low |
| **Impact** | Less engaging visuals |

**Description:** AI image generation can produce inconsistent characters, inappropriate imagery, or slow generation times.

**Mitigation:**
1. Strong prompts with character descriptions saved
2. Pre-generate some common scenes
3. Style consistency prompts ("in the style of children's book illustration")
4. Moderation layer for generated images
5. Fallback to stock fantasy illustrations if needed

---

#### R14: App Store Rejection (If Native Later)
| Attribute | Detail |
|-----------|--------|
| **Category** | Platform |
| **Severity** | LOW |
| **Likelihood** | Low |
| **Impact** | Delayed native launch |

**Description:** If you wrap PWA with Capacitor for iOS App Store, Apple might reject for:
- Insufficient native functionality
- AI-generated content concerns
- Kids category requirements

**Mitigation:**
1. Stay PWA as long as possible
2. If submitting to App Store, add native-feeling features
3. Comply with Apple's Kids category guidelines
4. Have App Store Optimization strategy

---

#### R15: Market Size Overestimation
| Attribute | Detail |
|-----------|--------|
| **Category** | Market |
| **Severity** | LOW |
| **Likelihood** | Low |
| **Impact** | Slower growth than projected |

**Description:** Phase 3 estimated SAM of $50-100M, but actual addressable market could be smaller if:
- Family D&D is more niche than anticipated
- Screen-light positioning confuses market
- Nordic market is smaller than estimated

**Mitigation:**
1. Launch fast, learn from real users
2. Your target (720 subscribers) is modest and achievable
3. Pivot capability - core tech could serve adjacent markets

---

## Critical Assumptions

These assumptions MUST be true for the product to succeed. If any are false, reconsider the approach.

### A1: Parents Will Pay for "Family Time" Apps
**Status:** Validated (Phase 2)
**Evidence:** Hero Kids, Calm Kids, AI Dungeon all prove parents pay for kids' apps
**Risk if False:** No viable business model

### A2: 7-13 Year Olds Will Engage with AI-Narrated Adventures
**Status:** Needs validation with your twins
**Evidence:** Indirect - kids engage with audiobooks, story apps
**Risk if False:** Core product doesn't work
**Validation:** Build prototype, test with twins within 2 weeks

### A3: "Screen-Light" Is a Feature, Not a Bug
**Status:** Assumed based on Nordic parenting trends
**Evidence:** Nordic legislation, parental sentiment
**Risk if False:** Marketing angle fails, need to reposition
**Validation:** User interviews during beta

### A4: Physical Dice Add Magic, Not Friction
**Status:** Needs validation
**Evidence:** TTRPGkids.com quotes about tangible props
**Risk if False:** Core differentiator becomes liability
**Validation:** Test with twins - does dice rolling feel fun or annoying?

### A5: Danish TTS Is Good Enough
**Status:** Needs validation
**Evidence:** ElevenLabs reviews positive, but untested with your family
**Risk if False:** Core feature fails in primary market
**Validation:** Generate sample narration, test with family this week

### A6: LLM Guardrails Can Be Kid-Safe
**Status:** Needs validation
**Evidence:** Other kid apps use LLMs, but content safety is hard
**Risk if False:** Reputational/legal risk, must add human review
**Validation:** Red-team testing with adversarial prompts

### A7: Family Account Model Satisfies COPPA
**Status:** Needs legal validation
**Evidence:** Similar models used by other kids apps
**Risk if False:** Major compliance work needed, possibly blocking US launch
**Validation:** Legal consultation before US launch

---

## Risk Mitigation Priority Matrix

| Risk | Severity | Mitigation Effort | Priority |
|------|----------|-------------------|----------|
| R1: COPPA Compliance | Critical | High | **DO FIRST** |
| R2: AI Content Safety | Critical | Medium | **DO FIRST** |
| R3: Danish TTS Quality | High | Low (just test) | **VALIDATE NOW** |
| R4: PWA iOS Limitations | High | Medium | Design around |
| R5: Giant Competition | High | Low | Differentiate |
| R6: Screen-Light Paradox | High | Medium | Messaging |
| R7: TTS Cost Scaling | High | Medium | Pricing model |
| R8: Physical Dice UX | Medium | Low | Test with twins |
| R9: GDPR Compliance | Medium | Low | Parent account model |
| R10: LLM API Reliability | Medium | Medium | Multi-provider |
| R11: Solo Developer | Medium | Medium | Scope ruthlessly |
| R12: Payments | Medium | Low | Use Stripe |

---

## Immediate Validation Actions

Before building MVP, validate these:

### This Week
1. [ ] Test ElevenLabs Danish TTS with sample adventure text
2. [ ] Play sample for your twins, gauge reaction
3. [ ] Test physical dice interaction concept (paper prototype)

### Before US Launch
1. [ ] COPPA legal consultation ($2,000-5,000)
2. [ ] Implement family account model (parent owns, kids are players)
3. [ ] Content moderation system in place
4. [ ] Privacy policy reviewed by attorney

### Before Scaling
1. [ ] TTS cost model validated at scale
2. [ ] Content safety red-team testing complete
3. [ ] EU/Denmark GDPR compliance confirmed

---

## Decision Points

### Decision 1: US Market Entry
**Question:** Launch in US (COPPA applies) or Denmark-only first?
**Recommendation:** Launch Denmark-first, add US after COPPA compliance confirmed
**Rationale:** Lower regulatory risk, faster to market, your primary testers are Danish

### Decision 2: PWA vs Capacitor for iOS
**Question:** Stay PWA or wrap with Capacitor for EU iOS users?
**Recommendation:** Start PWA, monitor iOS usage, wrap if >20% users on iOS
**Rationale:** PWA is faster to launch; Capacitor adds complexity

### Decision 3: Pricing Model
**Question:** Freemium with unlimited vs per-adventure credits?
**Recommendation:** Start with simple freemium, revisit if TTS costs spike
**Rationale:** Validate demand before optimizing unit economics

---

## Summary

**Top 5 Actions Before Launch:**

1. **COPPA Strategy** - Implement family account model, get legal review for US
2. **Content Safety** - Build guardrails, moderation, and testing before any child uses it
3. **Danish TTS Validation** - Test with your twins this week
4. **EU iOS Decision** - Determine if Capacitor wrapper needed for Denmark
5. **Pricing Model** - Plan for TTS costs, don't assume freemium works

**Green Lights:**
- Market validated (Phase 2-3)
- Differentiation clear (Phase 4)
- Technical path clear (Phase 6)
- Risks manageable with deliberate action

**Yellow Flags:**
- COPPA complexity if targeting US
- TTS cost scaling needs careful pricing
- EU iOS limitations may force native wrapper

**Red Flags:**
- None currently blocking launch

---

*Risk assessment conducted April 2026*
