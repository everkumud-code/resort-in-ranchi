const JHARKHAND_DISTRICTS = [
  "Bokaro",
  "Chatra",
  "Deoghar",
  "Dhanbad",
  "Dumka",
  "East Singhbhum",
  "Garhwa",
  "Giridih",
  "Godda",
  "Gumla",
  "Hazaribagh",
  "Jamtara",
  "Khunti",
  "Koderma",
  "Latehar",
  "Lohardaga",
  "Pakur",
  "Palamu",
  "Ramgarh",
  "Ranchi",
  "Sahebganj",
  "Saraikela Kharsawan",
  "Simdega",
  "West Singhbhum",
];

/**
 * A compact, sourced reference strip shown on every page, just above the
 * footer — emergency/government numbers, Jharkhand's districts, and
 * Jharkhand Tourism. Only pan-India standardized emergency numbers (100/101/
 * 108/1091/1077) and numbers taken directly from the Ranchi district
 * (ranchi.nic.in) and Jharkhand Tourism (tourism.jharkhand.gov.in) official
 * sites — nothing here is guessed, and both link out so a visitor can
 * verify directly.
 */
export default function LocalInfoSection() {
  return (
    <section className="border-t border-brand/10 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-semibold tracking-wide text-brand-dark/50 uppercase">Jharkhand &amp; Ranchi — quick reference</p>

        <div className="mt-4 grid grid-cols-1 gap-8 text-sm sm:grid-cols-3">
          <div>
            <p className="font-semibold text-brand-dark">Emergency &amp; government numbers</p>
            <ul className="mt-2 space-y-1 text-brand-dark/70">
              <li>Police: <span className="font-medium text-brand-dark">100</span></li>
              <li>Fire: <span className="font-medium text-brand-dark">101</span></li>
              <li>Ambulance: <span className="font-medium text-brand-dark">108</span></li>
              <li>Women&apos;s helpline: <span className="font-medium text-brand-dark">1091</span></li>
              <li>Disaster management: <span className="font-medium text-brand-dark">1077</span></li>
              <li>
                Ranchi DC (Collector) office:{" "}
                <a href="tel:06512214001" className="font-medium text-brand-teal hover:underline">
                  0651-2214001
                </a>
              </li>
              <li>
                Jharkhand Tourism, Ranchi info centre:{" "}
                <a href="tel:9102403884" className="font-medium text-brand-teal hover:underline">
                  9102403884
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-brand-dark">Jharkhand&apos;s 24 districts</p>
            <p className="mt-2 leading-6 text-brand-dark/70">{JHARKHAND_DISTRICTS.join(", ")}.</p>
          </div>

          <div>
            <p className="font-semibold text-brand-dark">Jharkhand Tourism</p>
            <p className="mt-2 leading-6 text-brand-dark/70">
              The state&apos;s official tourism department — travel resources, destinations and booking information
              for Jharkhand.
            </p>
            <a
              href="https://tourism.jharkhand.gov.in"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-2 inline-block font-medium text-brand-teal hover:underline"
            >
              Visit tourism.jharkhand.gov.in →
            </a>
          </div>
        </div>

        <p className="mt-6 border-t border-brand/10 pt-4 text-xs leading-5 text-brand-dark/50">
          Numbers above are sourced from official government pages and may change — for a real emergency always dial
          100/101/108 directly, and confirm any office number with the official website before relying on it.
        </p>
      </div>
    </section>
  );
}
