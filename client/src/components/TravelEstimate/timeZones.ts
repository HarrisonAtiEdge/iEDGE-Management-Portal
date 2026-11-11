// Time zones of the airports in lookups/seed/airportsSeed.ts, so flight times
// (which are always local to their airport) can be compared across zones.
//
// Each line is: IANA time zone | airport and city codes in it. Generated from
// the mwgg/Airports and OpenFlights airport lists; city codes such as LON use
// the zone of their airports. Airports added from the dropdown store their own
// zone on the record instead.
const RAW = `
Africa/Abidjan|ABJ
Africa/Accra|ACC
Africa/Addis_Ababa|ADD
Africa/Algiers|ALG ORN TMR
Africa/Asmara|ASM
Africa/Bamako|BKO
Africa/Bangui|BGF
Africa/Banjul|BJL
Africa/Blantyre|BLZ LLW
Africa/Brazzaville|BZV PNR
Africa/Bujumbura|BJM
Africa/Cairo|ASW CAI LXR
Africa/Casablanca|AGA CAS CMN FEZ RAK RBA TNG
Africa/Conakry|CKY
Africa/Dakar|DKR
Africa/Dar_es_Salaam|DAR JRO ZNZ
Africa/Djibouti|JIB
Africa/Douala|DLA GOU
Africa/Freetown|FNA HGS
Africa/Harare|BUQ HRE
Africa/Johannesburg|BFN CPT DUR ELS JNB KIM PLZ
Africa/Juba|JUB
Africa/Kampala|EBB
Africa/Kigali|GOM KGL
Africa/Kinshasa|FIH GMA MDK
Africa/Lagos|ABV KAD KAN LOS MIU PHC SKO
Africa/Libreville|LBV POG
Africa/Lome|LFW
Africa/Luanda|LAD
Africa/Lubumbashi|FBM FKI IRP KGA KND MJM
Africa/Lusaka|LUN LVI
Africa/Maputo|BEW MPM
Africa/Monrovia|MLW ROB
Africa/Nairobi|MBA NBO WIL
Africa/Ndjamena|NDJ
Africa/Niamey|NIM
Africa/Nouakchott|NKC
Africa/Ouagadougou|OUA
Africa/Porto-Novo|COO
Africa/Sao_Tome|TMS
Africa/Tripoli|BEN TIP
Africa/Tunis|DJE TUN
Africa/Windhoek|ERS LUD WDH
America/Adak|ADK AHT SYA
America/Anchorage|ADQ AET AKI AKN ANC ANI ANV ARC ATT BET BRW BTT CDV CHU CIK CKD DLG ENA FAI FYU GAL GNU HCR HOM HSL HUS ILI KAL KCL KGX KIB KKI KLG KPV KWN KWT KYU MCG MLL MRI NUL NUP PGM PKA PTH PTU RBY RDV RSH SCC SDP SHX SLQ SOV SRV SVS SWD SXW TAL TLT TNK UNK VEE WBQ WNA WTL
America/Antigua|ANU
America/Argentina/Buenos_Aires|AEP BUE EZE
America/Argentina/Cordoba|IGU
America/Argentina/Mendoza|MDZ
America/Argentina/Rio_Gallegos|RGL
America/Aruba|AUA
America/Asuncion|ASU
America/Bahia|SSA
America/Bahia_Banderas|PVR
America/Barbados|BGI
America/Belem|BEL
America/Belize|BZE TZA
America/Boa_Vista|BVB
America/Bogota|ADZ BAQ BGA BOG CLO CTG MDE PEI PYH SVZ
America/Boise|BOI PIH TWF
America/Cambridge_Bay|YCB
America/Campo_Grande|CGR
America/Cancun|CTM CUN CZM
America/Caracas|AGV BLA BNS BRM CAJ CCS CUM CUP CZE LSP MAR MRD MUN PBL PMV PZO SOM STD VLN VLV
America/Cayenne|CAY
America/Cayman|GCM
America/Chicago|ABI ABR ACT AMA ATW AUS AUW BHM BMI BNA BPT BRD BRO BTR CGI CGX CHI CID CLL CMI COU CRP CUX DAL DEC DFW DHN DLH DNV DSM ESF EVV FAR FSD FSM FYV GFK GGG GLH GPT GRB HIB HOU HRL HSV IAH ICT ILE IMT JAN JVL LAW LBB LCH LFT LIT LNK LRD LSE MAF MCI MDW MEI MEM MFE MGM MKC MKE MLI MLU MOB MOT MSL MSN MSP MSY MWA NGW OKC OMA ORD OSH PFN PIA PIR PNS RFD RST SAT SGF SGR SHV SJT SPI SPS STL TCL TOP TUL TXK TYR UBS VPS
America/Chihuahua|CUU
America/Costa_Rica|SJO
America/Cuiaba|CGB
America/Curacao|CUR
America/Dawson_Creek|YXJ
America/Denver|ABQ BDG BIL BTM BZN CDC CNM COS CPR DEN DRO DTA ELP FCA FIL GTF GUC HLN JAC KNB MLF MSO RAP ROL ROW SBS SGU SLC VEL WBU
America/Detroit|AZO BTL DET DTT DTW FNT GRR LAN MBS MKG MQT TVC YAM YIP
America/Dominica|DCF DOM
America/Edmonton|YEA YED YEG YHY YQL YQU YXD YYC YZF
America/El_Salvador|SAL
America/Fort_Nelson|YYE
America/Fortaleza|FOR NAT SLZ
America/Godthab|SFJ
America/Goose_Bay|YWK YYR
America/Grand_Turk|GDT PLS
America/Grenada|GND
America/Guadeloupe|PTP
America/Guatemala|FRS GUA
America/Guayaquil|CUE GYE UIO
America/Guyana|LUB
America/Halifax|YHZ
America/Havana|HAV
America/Hermosillo|HMO
America/Indiana/Indianapolis|FWA IND SBN
America/Inuvik|YEV YFS YVQ
America/Iqaluit|YFB YGW YUX
America/Jamaica|KIN KTP MBJ
America/Juneau|JNU
America/Kentucky/Louisville|SDF
America/Kralendijk|BON
America/La_Paz|ASC CBB LPB SRZ VVI
America/Lima|ANS AQP ARI AYP CHH CIX CJA CUZ JJI JUL LIM PCL PEM PIU RIJ TBP TCQ TGI TPP TRU TYL YMS
America/Los_Angeles|ACV BFL BLI BUR CIC COE EAT EKO ELY EMB EUG FAT LAS LAX LGB MFR OAK ONT OXR PDX PSC PSP RDD RNO SAN SBA SCK SEA SFO SJC SMF SMX SNA TIJ UKI VGT VNY YKM
America/Lower_Princes|SXM
America/Managua|MGA
America/Manaus|MAO
America/Martinique|FDF
America/Matamoros|MAM NLD
America/Mazatlan|CUL LAP LMM LTO MZT SJD
America/Merida|CME CZA MID
America/Mexico_City|ACA AGU CLQ GDL HUX MEX MLM MTT OAX PBC PXM SLP TGZ VER VSA ZCL ZIH ZLO
America/Moncton|YFC YQM
America/Monterrey|DGO MTY SLW TRC
America/Montevideo|MVD
America/Nassau|FPO NAS
America/New_York|ABE ABY ACK ACY AGS AIY ALB AOO APF ATL AVL AVP BDL BDR BGM BGR BKL BNH BOS BTV BWI CAE CAK CHA CHS CLE CLT CMH CSG CVG DAB DAY DCA ELM ERI EWB EWN EWR FAY FMY FPR GNV GSO GSP HAR HFD HPN HTS HYA IAD IAG ILM ISP ITH JAJ JAO JAX JDM JFK LEB LGA MCN MCO MHT MIA MLB MPB MTN MVY MYR NYC ORF PBI PGV PHF PHL PIT PKB PNE PQI PVD PWM PYM RDU RIC ROA ROC RWI SAV SRQ SWF SYR TLH TOL TPA TRI TTN TYS VLD WAS
America/Nome|CDB CYF DUT EEK HPB KFP KKH KPN KSM KUK KVC KWK MYU NME OME OOK OTZ SCM STG VAK WWT
America/Panama|PAC PTY
America/Paramaribo|ORG PBM
America/Phoenix|AZA FLG PHX SCF SDX TUS
America/Port_of_Spain|POS TAB
America/Port-au-Prince|PAP
America/Porto_Velho|PVH
America/Puerto_Rico|ARE CPX MAZ PSE SIG SJU VQS
America/Punta_Arenas|PUQ
America/Recife|REC
America/Regina|YQR
America/Resolute|YRB
America/Rio_Branco|CZS
America/Santarem|TMT
America/Santiago|ANF BBA CCP CJC CPO ESR GXQ IQQ LOB PMC SCL ZCO ZOS
America/Santo_Domingo|POP SDQ
America/Sao_Paulo|BHZ BSB CGH CWB GIG GRU POA RIO SAO SDU VCP
America/Sitka|KTN PSG SIT WRG
America/St_Johns|YDF YYT
America/St_Kitts|SKB
America/St_Lucia|SLU UVF
America/St_Thomas|STT
America/St_Vincent|SVD
America/Tegucigalpa|LCE RTB SAP TGU
America/Toronto|YGL YHM YMQ YMX YOW YQB YQG YQT YSB YSR YTO YTZ YUL YVO YVP YXU YYZ
America/Tortola|EIS
America/Vancouver|YAL YPR YVR YXS YXT YYJ
America/Whitehorse|YQH YXY
America/Winnipeg|YWG
America/Yakutat|YAK
Asia/Aden|ADE SAH
Asia/Almaty|ALA KGF
Asia/Amman|AMM AQJ ETH
Asia/Baghdad|BGW BSR SDA
Asia/Bahrain|BAH
Asia/Bangkok|BKK CNX HAN HDY HKT
Asia/Beirut|BEY
Asia/Brunei|BWN
Asia/Colombo|CMB
Asia/Damascus|ALP DAM
Asia/Dhaka|CGP DAC
Asia/Dubai|AUH DXB FJR SHJ
Asia/Famagusta|ECN
Asia/Ho_Chi_Minh|SGN
Asia/Hong_Kong|HKG
Asia/Jakarta|CGK HLP JKT MES PLM SUB
Asia/Jayapura|BIK MAL
Asia/Jerusalem|SDV TLV
Asia/Kabul|KBL
Asia/Karachi|ISB KHI LHE PEW UET
Asia/Kathmandu|KTM
Asia/Kolkata|AMD ATQ BLR BOM CCJ CCU COK DEL GAU HYD JAI LKO MAA TRV
Asia/Krasnoyarsk|ABA KJA NSK
Asia/Kuala_Lumpur|AOR IPH JHB KUL LGK PEN XSP
Asia/Kuching|BKI BTU KCH LBU LDU MYY SBW SDK SPE TWU
Asia/Kuwait|KWI
Asia/Magadan|GDX
Asia/Makassar|DPS MDC
Asia/Manila|CEB DVO MNL
Asia/Muscat|MCT
Asia/Nicosia|LCA PFO
Asia/Novosibirsk|OVB
Asia/Phnom_Penh|PNH
Asia/Pyongyang|FNJ
Asia/Qatar|DOH
Asia/Riyadh|ABT AHB DHA ELQ HAS JED MED RUH TIF TUU
Asia/Sakhalin|UUS
Asia/Seoul|CJU KWJ PUS SEL TAE
Asia/Shanghai|AKA BAV BJS CAN CGO CGQ CKG CSX CTU DLC FOC HAK HET HFE HGH HRB INC KHN KMG KWE KWL LHW LXA NAY NGB NKG NNG PEK SHA SHE SIA SJW SWA SYX SZX TAO TNA TSN TYN URC WUH XMN YNT ZHA
Asia/Singapore|QPG SIN
Asia/Taipei|KHH TPE TSA TXG
Asia/Tashkent|TAS
Asia/Tbilisi|SUI
Asia/Tehran|ABD BND BUZ IFN KER MHD SYZ TBZ THR ZAH
Asia/Tokyo|AKJ AOJ AXT CTS FUK GAJ HIJ HKD HND ITM KCZ KIJ KIX KMI KMJ KMQ KOJ KUH MYJ NGO NGS NRT OIT OKA OKD OKJ OSA SDJ SPK TAK TKS TOY TTJ TYO UBJ
Asia/Ulaanbaatar|ULN
Asia/Vientiane|NEU VTE
Asia/Vladivostok|KHV VVO
Asia/Yangon|RGN
Asia/Yekaterinburg|SVX
Asia/Yerevan|EVN
Atlantic/Azores|PDL TER
Atlantic/Bermuda|BDA
Atlantic/Canary|LPA TCI TFN TFS
Atlantic/Cape_Verde|SID
Atlantic/Madeira|FNC
Atlantic/Reykjavik|REK
Australia/Adelaide|ADL
Australia/Brisbane|BNE CNS
Australia/Darwin|DRW
Australia/Hobart|LST
Australia/Melbourne|KAH MEB MEL
Australia/Perth|LER MKR PER PHE
Australia/Sydney|SYD
Europe/Amsterdam|AMS EIN ENS GRQ MST RTM SPL
Europe/Athens|ATH AXD HER SKG
Europe/Belgrade|BEG INI
Europe/Berlin|BER BRE CGN DRS DUS ERF FDH FMO FRA HAG HAJ HAM KSF LEJ MUC NUE SCN STR SXF SZG THF TXL
Europe/Bratislava|BTS
Europe/Brussels|ANR BRU LGG OST
Europe/Bucharest|BBU BUH OTP TSR
Europe/Budapest|BUD
Europe/Copenhagen|AAL AAR BLL CPH KRP RKE SGD
Europe/Dublin|DUB ORK SNN
Europe/Guernsey|GCI
Europe/Helsinki|HEL KUO POR TKU TMP VAA
Europe/Istanbul|ADA ADB ANK AYT DLM ESB IGL IST IZM
Europe/Jersey|JER
Europe/Kiev|IEV KBP
Europe/Lisbon|FAO LIS OPO
Europe/Ljubljana|LJU MBX
Europe/London|ABZ BFS BHD BHX BOH BRS CWL EDI EMA EXT GLA HUY ISC LBA LCY LGW LHR LON LPL LSI LTN LWK MAN MME NCL NWI PIK SCS STN TSO
Europe/Luxembourg|LUX
Europe/Madrid|AGP ALC BCN BIO MAD OVD PMI SCQ SVQ VIT VLC VLL ZAZ
Europe/Malta|MLA
Europe/Minsk|MSQ
Europe/Moscow|AER DME LED MOW MRV SVO VKO
Europe/Oslo|BDU BGO BOO EVE FBU GEN HAU KRS OSL SVG TOS TRD
Europe/Paris|AJA BES BIA BIQ BOD BSL CDG CLY ENC FNI GNB GVA LBG LDE LEH LIG LIL LYS MLH MPL MRS NCE NCY NTE ORY PAR PGF PUF SXB TLN TLS URO
Europe/Prague|PRG
Europe/Riga|RIX RSC
Europe/Rome|AOI BGY BLQ BRI CIA CTA FCO FLR GOA LIN MIL MXP NAP PMO PSA PSR RMI ROM SWK TRN TRS TSF VCE VRN
Europe/Simferopol|SIP
Europe/Sofia|SOF
Europe/Stockholm|AGH ARN BMA GOT JKG KRN LLA MMA NRK ORB SDL STO UME VST VXO
Europe/Tallinn|TLL
Europe/Vienna|GRZ INN KLU LNZ VIE
Europe/Vilnius|VNO
Europe/Warsaw|WAW
Europe/Zagreb|OSI ZAG
Europe/Zurich|BRN BXO LUG ZRH
Indian/Antananarivo|TNR
Indian/Comoro|HAH YVA
Indian/Mahe|SEZ
Indian/Maldives|MLE
Indian/Mauritius|MRU
Indian/Reunion|RUN
Pacific/Apia|APW
Pacific/Auckland|AKL CHC WLG
Pacific/Chuuk|TKK YAP
Pacific/Easter|IPC
Pacific/Efate|VLI
Pacific/Fiji|NAN SUV
Pacific/Guam|GUM
Pacific/Honolulu|HNL ITO KOA LIH LNY MKK OGG
Pacific/Johnston|JON
Pacific/Kosrae|KSA
Pacific/Kwajalein|KWA
Pacific/Majuro|MAJ
Pacific/Noumea|GEA NOU
Pacific/Pago_Pago|PPG
Pacific/Palau|ROR
Pacific/Pohnpei|PNI
Pacific/Port_Moresby|GKA HGU HKN LAE POM RAB
Pacific/Rarotonga|RAR
Pacific/Saipan|ROP SPN
Pacific/Tahiti|AAA PPT
Pacific/Tongatapu|TBU
`;

let byCode: Map<string, string> | null = null;

function zoneTable(): Map<string, string> {
  if (byCode) return byCode;
  byCode = new Map();
  RAW.split("\n").forEach((line) => {
    const [zone, codes] = line.split("|");
    if (!zone || !codes) return;
    codes.split(" ").forEach((code) => byCode!.set(code, zone));
  });
  return byCode;
}

const formatters = new Map<string, Intl.DateTimeFormat | null>();

/** Null if the browser doesn't know the zone. */
function formatterFor(timeZone: string): Intl.DateTimeFormat | null {
  if (!formatters.has(timeZone)) {
    try {
      formatters.set(
        timeZone,
        new Intl.DateTimeFormat("en-US", {
          timeZone,
          hourCycle: "h23",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      formatters.set(timeZone, null);
    }
  }
  return formatters.get(timeZone) ?? null;
}

export const isKnownTimeZone = (timeZone: string) => Boolean(timeZone) && formatterFor(timeZone) !== null;

/** Zone for an airport or city code from the built-in table, or "". */
export function builtInTimeZone(code: string, cityCode?: string): string {
  const table = zoneTable();
  return table.get(code.toUpperCase()) ?? (cityCode ? table.get(cityCode.toUpperCase()) : undefined) ?? "";
}

/** Every zone the browser knows, for picking one when adding an airport. */
export function allTimeZones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  try {
    if (intl.supportedValuesOf) return intl.supportedValuesOf("timeZone");
  } catch {
    // Older browser: fall back to the zones the airport table uses.
  }
  return Array.from(new Set(zoneTable().values())).sort();
}

interface WallClock {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
}

function wallClockAt(utcMs: number, timeZone: string): WallClock | null {
  const formatter = formatterFor(timeZone);
  if (!formatter) return null;
  const parts: Record<string, number> = {};
  formatter.formatToParts(new Date(utcMs)).forEach((part) => {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  });
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour % 24, minute: parts.minute };
}

/** Minutes the zone is ahead of UTC at that instant, e.g. 300 for Karachi. */
export function utcOffsetMinutes(utcMs: number, timeZone: string): number | null {
  const clock = wallClockAt(utcMs, timeZone);
  if (!clock) return null;
  const asUtc = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute);
  return Math.round((asUtc - Math.floor(utcMs / 60_000) * 60_000) / 60_000);
}

/**
 * The instant a local date and time happen in a zone, as UTC milliseconds.
 * Accounts for daylight saving on that date. Null if the date, time or zone
 * isn't usable.
 */
export function zonedToUtc(isoDate: string, time: string, timeZone: string): number | null {
  const date = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const clock = time.match(/^(\d{2}):(\d{2})$/);
  if (!date || !clock || !isKnownTimeZone(timeZone)) return null;

  const asUtc = Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3]), Number(clock[1]), Number(clock[2]));
  // Guess with the offset at that moment, then correct once in case the guess
  // landed on the other side of a daylight saving change.
  const firstOffset = utcOffsetMinutes(asUtc, timeZone) ?? 0;
  const guess = asUtc - firstOffset * 60_000;
  const secondOffset = utcOffsetMinutes(guess, timeZone) ?? firstOffset;
  return secondOffset === firstOffset ? guess : asUtc - secondOffset * 60_000;
}

/** Local date (yyyy-MM-dd) and time (HH:mm) in a zone at a UTC instant. */
export function zonedDateTime(utcMs: number, timeZone: string): { date: string; time: string } | null {
  const clock = wallClockAt(utcMs, timeZone);
  if (!clock) return null;
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${clock.year}-${pad(clock.month)}-${pad(clock.day)}`,
    time: `${pad(clock.hour)}:${pad(clock.minute)}`,
  };
}

/** 330 → "UTC+5:30", -300 → "UTC-5", 0 → "UTC". */
export function formatUtcOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "UTC";
  const sign = offsetMinutes > 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const minutes = absolute % 60;
  return `UTC${sign}${Math.floor(absolute / 60)}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
}
