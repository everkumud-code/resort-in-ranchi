> OLD DRAFT: superseded by StatAxis-YouTube-quota-form-FINAL.docx. Its statements that StatAxis has no deletion limit are wrong: the retention job (36 months for statistics and derived metrics, 30 days for titles and other data) already runs. Use the FINAL file.

# StatAxis: YouTube Data API quota increase — step by step guide, answers and instructions

Prepared 14 Oct 2026. Form answers are in English (the form is in English); the explanations are in Hinglish.

---------------------------------------------------------------------------------------------------

## 0. PEHLE YE PADHEIN (zaroori): ek compliance risk hai

Quota badhane ke liye YouTube pehle **audit** karta hai ki aapka project "YouTube API Services Terms of Service" aur "Developer Policies" follow karta hai. Maine official Developer Policies page padha. Uske hisaab se 3 baatein StatAxis ke model se takrati dikhti hain (pakka karne ke liye neeche ke sections khud padhein, ye ek automatic summary par based hai):

| # | Policy (section) | StatAxis mein kya hota hai |
|---|---|---|
| 1 | Public ("non-authorized") statistics 30 din se zyada store nahi kar sakte; 30 din baad delete ya refresh karna hota hai (III.E.4.b aur III.E.4.d) | Hum views/viewers ki **purani history mahino tak** rakhte hain (weekly, monthly, quarterly, yearly reports isi par bante hain) |
| 2 | API data se "naye ya derived metrics" banana, ya YouTube data ki jagah khud ka calculated data dikhana mana hai, jab tak saaf likha na ho ki wo YouTube ka nahi hai (III.E.4.h) | **STX Index, IFX Score, forecasts** hamare apne derived metrics hain |
| 3 | Aggregation sirf ek hi content owner ke channels ke liye, aur sirf usi owner ko dikhna chahiye (III.E.2.a) | Hum **kai alag publishers** ke channels ko jodkar market ranking banate hain aur clients ko dikhate hain |
| 4 | Authorized (channel owner ke OAuth wale) data ke liye lambi retention allowed, aur "derived metrics" ki ijazat sirf **audited analytics developers** ko jo approval le chuke hon (III.L) | Hum OAuth/authorized data nahi lete, sirf public data |

**Iska matlab:** agar aap form mein sab sach likhenge (aur sach hi likhna hai), to review mein sawaal uthenge ya request reject ho sakti hai. Agar jhooth ya adhoora likhenge to project band bhi ho sakta hai (aur wo pehle se mil rahe 10,000 units bhi chale jaayenge). Isliye:

1. **Aaj apply karne se pehle** Developer Policies ke ye sections khud padhein: III.E.2, III.E.4, III.L. Link: https://developers.google.com/youtube/terms/developer-policies (aur saath mein "Developer Policies Guide": https://developers.google.com/youtube/terms/developer-policies-guide).
2. Kisi **lawyer ya compliance salahkar** se 30 minute ka review karwana achha rahega, kyunki hamara pura product public data ki history aur derived index par chalta hai.
3. Teen raaste hain (apni marzi se chunein):
   - **A. Seedha aur imaandaar:** form mein poora model batayein (neeche Answer Pack A) aur YouTube se poochein ki kya "analytics developer approval" (III.L) ya koi permission mil sakti hai. Approval na mile to model badalna padega.
   - **B. Model badalna (policy-friendly):** public statistics sirf 30 din tak rakhein (phir delete ya refresh), history sirf **apne** derived aggregates ke roop mein... lekin ye bhi (#2, #3) ke hisaab se risky hai. Isse weekly/monthly/yearly reports ka data kam ho jayega.
   - **C. Authorized route:** channel owners (clients) se OAuth permission lekar unka Analytics data (YouTube Analytics / Reporting API) use karna. Isme lambi retention aur derived metrics ki jagah hai, par sirf unhi channels ke liye jo permission dein. Public competitor ranking isse nahi banegi.
4. Aap jo bhi chunen, mujhe batayein: main code mein "30 din baad purana data hatao/refresh karo", "YouTube ka nahi hai" disclosure aur retention ka screen bana sakta hoon.

**Meri salah:** aaj hi form bharna theek hai, par **Answer Pack A** ki tarah poora sach batate hue, aur isse pehle upar ke teen sections padh lein. Quota milne ki guarantee koi nahi de sakta.

---------------------------------------------------------------------------------------------------

## 1. Kitna quota maangna hai (aapke apne numbers se)

Abhi: 10,000 units/din (default). Hamara use abhi ~5,270/din (75-second live polling, 32 channels). Admin menu ke "YouTube quota" screen ka formula yahi hai: har 50 live videos ke liye 1 unit har poll, har channel ke liye 1 unit playlist + collection ke batches.

| Plan | Channels | Live poll | Collect | Units/din | 15% headroom ke saath |
|---|---|---|---|---|---|
| Abhi chal raha | 32 | 75 sec | 6400 sec | 5,270 | ~6,100 |
| Fast live (sirf tracked channels) | 32 | 30 sec | 30 min | 13,872 | **~16,000** |
| Poori list, tez | 166 | 30 sec | 1 ghanta | 26,232 | **~30,200** |
| Poori list, normal | 166 | 60 sec | 1 ghanta | 16,152 | ~18,600 |
| **Aapka naya plan** | **300+** | **15 sec** | 1 ghanta | **62,784** | **~72,200** |
| 300 channels, 15 sec, collect 30 min | 300 | 15 sec | 30 min | 73,728 | ~84,800 |
| 350 channels, 15 sec | 350 | 15 sec | 1 ghanta | 76,128 | ~87,500 |
| Hybrid: top 100 channels 15 sec, baaki 200 channels 60 sec | 300 | 15 / 60 sec | 1 ghanta | 36,864 | ~42,400 |
| 300 channels sab 30 sec | 300 | 30 sec | 1 ghanta | 36,864 | ~42,400 |
| 300 channels sab 60 sec | 300 | 60 sec | 1 ghanta | 23,904 | ~27,500 |

**Kya maangein (aapke plan ke hisaab se: 300+ channels, 15 second):** **75,000 units/din** (hisaab: 62,784 + 15% headroom = ~72,200, gol karke 75,000). Agar 350 channels tak badhana ho to ~90,000.

**Dhyan dein:** itna bada number (default ka 7 guna) YouTube ke liye bhi bada hai, to review zyada sakht hoga. Do tareeke se aap request ko halka bana sakte hain: (1) **Hybrid** (sirf sabse bade ~100 channels 15 second par, baaki 200 channel 60 second par) ~42,000 units, ya (2) sab channels 30 second par, ~42,000 units. Form mein bhi likh sakte hain ki "pehle 40,000 maang rahe hain, zaroorat dikhne par badhayenge." Ye aapka faisla hai.

Form mein "requested quota" ke saath hamesha uska hisaab bhi likhein (neeche Answer Pack mein hai).

---------------------------------------------------------------------------------------------------

## 2. Apply karne se pehle taiyaari (checklist)

1. **Google Cloud Console** kholein: https://console.cloud.google.com → apna wahi project jisme YouTube Data API v3 ON hai (jiski key StatAxis use karta hai).
2. **Project number** note karein (Dashboard par "Project number", 12 akshar wala number). Form mein maangta hai.
3. **API & Services → Quotas** ya "YouTube Data API v3 → Quotas": aaj ka use ka screenshot len (saath mein 7 din ka graph). Ye form ke saath ya reviewer ke sawaal par kaam aata hai.
4. **API key restriction:** key ko sirf YouTube Data API v3 par restrict karein (server IP 187.126.116.161 par bhi). Ye audit mein achha dikhta hai.
5. **Website live aur accurate ho:** https://www.stataxis.org — Privacy Policy (https://www.stataxis.org/privacy) aur Terms (https://www.stataxis.org/terms) mein YouTube ka zikr ho. Hamari Privacy Policy mein "YouTube API Services" aur "Google Privacy Policy" wali line hai. Check kar lein ki Terms mein bhi "YouTube Terms of Service" ka link ho.
6. **Contact email** jo aap check karte hain (YouTube is par likhega). `ever.kumud@gmail.com` ya `stax9@stataxis.org`. Form mein wahi daalein jo Cloud project ka owner hai.
7. **Screenshots / video (2–3 minute screen recording)** taiyaar rakhein (YouTube maang sakta hai): Weekly report, Report builder, STX Index screen, "Data via YouTube. Processed and evaluated by StatAxis." wali line, Privacy page. (Workspace mein login karke.)
8. **Attribution:** hamari images/PDF par "Data via YouTube. Processed and evaluated by StatAxis." likha hai. Ye theek hai; YouTube ka logo ya brand use na karein.

---------------------------------------------------------------------------------------------------

## 3. Step by step: form kaise bharein

**Form ka link:** https://support.google.com/youtube/contact/yt_api_form (YouTube API Services - Audit and Quota Extension Form). Google ka guide: https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits

1. Form kholein, apne **usi Google account** se login karein jisse Cloud project banaya hai.
2. Pehle sawaal mein jo option aap par lagu ho wo chunein: **"Quota Extension Request"** (ya jo option "audit + quota extension" ke liye diya ho). Agar "Complete a compliance audit to keep current quota" jaisa option dikhe, wo sirf re-audit ke liye hai, usse na chunein.
3. **Business / organization details:** apna sahi naam, company (agar company registered hai to uska poora naam aur desh), website https://www.stataxis.org, contact email.
4. **API project:** Cloud project ka naam aur **project number**; API client ka naam: *StatAxis* (server-side web application, koi mobile ya OAuth app nahi).
5. **How you use the API:** neeche ka "Answer Pack" use karein (ek ek sawaal ke jawab diye hain). Form ke sawaal jaise-jaise dikhein, wahi jawab copy karein.
6. **Requested quota:** 30,000 units/din, hisaab ke saath (Answer 8).
7. Attachments maange to screenshots/video ka link daalein (Drive link, "anyone with link can view").
8. Submit karein. Confirmation email save karein. YouTube API team email se sampark karti hai (koi fixed time nahi dete). Review mein hafte lag sakte hain; reply 2–3 din ke andar dena achha rehta hai.
9. Reject ho to **Appeals Form** hai.

**Dhyan rakhein:** form mein kuch bhi jhoot ya gol-mol na likhein (retention, derived metrics, kai publishers ka data). Agar reviewer ko baad mein pata chala to project ban ho sakta hai.

---------------------------------------------------------------------------------------------------

## 4. ANSWER PACK A: poora sach (recommended)

(Jahan [ ] hai wahan apna naam/detail bharein.)

**1. What is your application / service?**
StatAxis (https://www.stataxis.org) is a media measurement platform for Indian digital news. It measures the public performance of YouTube news channels (live audience, views of new videos, uploads) and publishes comparisons and an index (the "STX Index") to media companies, advertisers, agencies and researchers. It is a server-side web application. It does not use YouTube Analytics, does not ask channel owners to log in, and does not use OAuth or any private channel data.

**2. Who are your users?**
Registered business users (media companies, agencies, advertisers, campaigns, researchers) who log in to a workspace and read reports. We do not offer the YouTube API itself to third parties and we do not resell raw API data.

**3. Which API methods do you call, and how often?**
- `playlistItems.list` (1 call per tracked channel per collection pass) to find the channel's recent uploads;
- `channels.list` (batched, 50 channels per call) for public channel statistics;
- `videos.list` (batched, 50 videos per call) for public video statistics, and for `liveStreamingDetails.concurrentViewers` of streams that are live now.
We do not call `search.list` in the live path. We do not upload, comment, rate or modify anything. All calls are read-only with an API key.

**4. What data do you store, for how long, and why?** *(answer honestly with your real policy; if you move to a 30-day rule, say so)*
We store time-stamped readings of public statistics (video views, likes, comment counts, live concurrent viewers, channel subscriber counts), and the channel and video titles/IDs. We use them to compute averages and peaks over a period, week-over-week movement, and an index. [State the actual retention here. Today the readings are kept [N months]; we are asking whether this is acceptable or what limit applies to a measurement service, and we will follow the answer.] We do not store personal data of YouTube viewers or commenters.

**5. Do you calculate derived or aggregated metrics from API data? How are they labelled?**
Yes. We calculate (a) averages/peaks of public concurrent viewers across a period, (b) views gained by videos uploaded in a period, (c) a composite index (STX) that combines these public signals, and (d) side-by-side rankings of channels owned by different publishers. Every page and file produced by StatAxis states "Data via YouTube. Processed and evaluated by StatAxis. Not TV ratings." We make clear that these figures are StatAxis's calculation and not YouTube's. We request guidance/approval for this use under the analytics developer provisions of the Developer Policies (Section III.L) if it applies.

**6. How do you show YouTube data to users and keep it fresh?**
Values shown are the values returned by the API at the time shown ("as last measured"). Each report shows when it was made. Stale readings are flagged and not presented as current. [Describe the refresh/delete process you implement.]

**7. How do you handle user privacy, terms and deletion?**
Our Privacy Policy (https://www.stataxis.org/privacy) and Terms (https://www.stataxis.org/terms) state that the service uses YouTube API Services, link to the YouTube Terms of Service (https://www.youtube.com/t/terms) and the Google Privacy Policy (https://policies.google.com/privacy). Users can ask for deletion of their account data at [email]. Since we use no Authorized Data, there is nothing for a user to revoke in Google security settings.

**8. How much quota do you need and why? (Requested: 75,000 units/day)**
Current default 10,000 units/day. We plan to measure more than 300 news channels (about 450 simultaneous live streams at peak) with a 15-second reading interval during live programmes, because live audiences move within seconds around breaking news and commercial breaks. Calculation per day:
- Live polling every 15 s: ceil(450 / 50) = 9 `videos.list` calls × 5,760 polls = 51,840 units.
- Collection pass every hour: 300 `playlistItems.list` + 6 `channels.list` + 300 × 25 videos / 50 = 150 `videos.list` = 456 units × 24 = 10,944 units.
Total ≈ 62,784 units; with 15% headroom ≈ 72,200, so we request 75,000 units/day. With only the current default we have to poll every 75 s and track only 32 channels. If a smaller grant is more appropriate, we can start with a hybrid (about 100 channels every 15 s, the others every 60 s, about 42,000 units/day) and grow when the audit is passed.

**9. What have you done to use quota efficiently?**
All `videos.list` and `channels.list` calls are batched at 50 ids. We never call `search.list` in the live loop. We cap requests at 60/minute and 9,000/day inside our client (a built-in budget guard), cache results, and reuse readings across all users (users never trigger API calls).

**10. Is anyone's content copied, downloaded or republished?**
No. We do not download, store or redistribute video or audio. We store only statistics and titles, and we link to YouTube for content.

**11. Do you use the data to profile, advertise to or identify individual viewers?**
No. All figures are aggregates of public counters. We cannot identify viewers.

**12. Any other information?**
The measurement is used as a media-planning and research reference. Figures are labelled as measured on YouTube, not TV ratings. We welcome an audit and will change retention, labelling or any behaviour the API Services team asks for.

---------------------------------------------------------------------------------------------------

## 5. ANSWER PACK B: agar aap model badalte hain (30 din ka rule maanna)

Sirf ye jawab badlenge:
- **Answer 4:** "Raw public statistics are kept for at most 30 days and then deleted or refreshed from the API. Long-term we keep only [ ] that is not API Data, e.g. our own editorial notes / reports already published to clients." (Sach likhein: historical reports ke liye kya bachega.)
- **Answer 5:** "We do not create independent metrics from API data beyond [ ]." (Agar STX band karte hain.)
- Code mein: mujhse kehkar purana data delete/refresh wala job aur "retention" admin screen banwa lein, tab hi ye jawab dein (jhoot nahi).

---------------------------------------------------------------------------------------------------

## 6. Form bharne ke baad

- Confirmation email aur form ki copy save karein.
- Cloud Console ke **Quotas** page par roz check karein ki quota kitna use ho raha hai.
- YouTube ka email aaye to turant jawab dein; screenshots/recording taiyaar rakhein.
- **Tab tak:** live polling 60 second par rakhein (64% quota). Quota badhne par 30 second ya zyada channels chalayenge.
- Reject hone par "Appeals Form" use karein aur reviewer ke bataye gaye sections theek karke dobara bhejein.
- Quota milte hi mujhe batayein: main polling 30 second kar dunga aur baaki channels ON karne mein madad karunga (Tamil, Telugu, Bangla, Kannada: abhi OFF hain).

---------------------------------------------------------------------------------------------------

## 7. Links

- Audit aur quota guide: https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits
- Form: https://support.google.com/youtube/contact/yt_api_form
- Developer Policies: https://developers.google.com/youtube/terms/developer-policies
- Developer Policies Guide: https://developers.google.com/youtube/terms/developer-policies-guide
- YouTube API Services Terms: https://developers.google.com/youtube/terms/api-services-terms-of-service
- Quota calculator (units per method): https://developers.google.com/youtube/v3/determine_quota_cost
