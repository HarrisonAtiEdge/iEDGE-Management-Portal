// Starter list of airlines (IATA designators) and alliances. The IATA codes
// PDF has no airline codes, so this covers the major carriers; anything
// missing is added from the dropdown. Each line is: code | name | kind.
//
// Used only to seed Panels/IEDGE-SYSTEM/Travel/Airlines/items the first time
// the list is opened; after that the dropdown reads from Firestore.
const RAW = `
*A|Star Alliance|alliance
*O|oneworld|alliance
*S|SkyTeam|alliance
PK|Pakistan International Airlines|airline
PA|Airblue|airline
PF|AirSial|airline
ER|SereneAir|airline
9P|Fly Jinnah|airline
EK|Emirates|airline
QR|Qatar Airways|airline
EY|Etihad Airways|airline
FZ|flydubai|airline
G9|Air Arabia|airline
3L|Air Arabia Abu Dhabi|airline
SV|Saudia|airline
XY|flynas|airline
F3|flyadeal|airline
GF|Gulf Air|airline
WY|Oman Air|airline
OV|SalamAir|airline
KU|Kuwait Airways|airline
J9|Jazeera Airways|airline
RJ|Royal Jordanian|airline
ME|Middle East Airlines|airline
MS|EgyptAir|airline
TK|Turkish Airlines|airline
PC|Pegasus Airlines|airline
IR|Iran Air|airline
W5|Mahan Air|airline
IA|Iraqi Airways|airline
LY|El Al|airline
FG|Ariana Afghan Airlines|airline
RQ|Kam Air|airline
BA|British Airways|airline
VS|Virgin Atlantic|airline
LH|Lufthansa|airline
LX|Swiss International Air Lines|airline
OS|Austrian Airlines|airline
SN|Brussels Airlines|airline
AF|Air France|airline
KL|KLM Royal Dutch Airlines|airline
IB|Iberia|airline
VY|Vueling|airline
UX|Air Europa|airline
AZ|ITA Airways|airline
TP|TAP Air Portugal|airline
SK|SAS Scandinavian Airlines|airline
AY|Finnair|airline
LO|LOT Polish Airlines|airline
OK|Czech Airlines|airline
RO|TAROM|airline
A3|Aegean Airlines|airline
EI|Aer Lingus|airline
FR|Ryanair|airline
U2|easyJet|airline
W6|Wizz Air|airline
DY|Norwegian Air Shuttle|airline
EW|Eurowings|airline
DE|Condor|airline
LG|Luxair|airline
BT|airBaltic|airline
JU|Air Serbia|airline
OU|Croatia Airlines|airline
FI|Icelandair|airline
SU|Aeroflot|airline
PS|Ukraine International Airlines|airline
HY|Uzbekistan Airways|airline
KC|Air Astana|airline
J2|Azerbaijan Airlines|airline
AA|American Airlines|airline
DL|Delta Air Lines|airline
UA|United Airlines|airline
WN|Southwest Airlines|airline
AS|Alaska Airlines|airline
B6|JetBlue|airline
NK|Spirit Airlines|airline
F9|Frontier Airlines|airline
HA|Hawaiian Airlines|airline
AC|Air Canada|airline
WS|WestJet|airline
AM|Aeromexico|airline
Y4|Volaris|airline
CM|Copa Airlines|airline
AV|Avianca|airline
LA|LATAM Airlines|airline
G3|GOL Linhas Aereas|airline
AD|Azul Brazilian Airlines|airline
AR|Aerolineas Argentinas|airline
SQ|Singapore Airlines|airline
TR|Scoot|airline
CX|Cathay Pacific|airline
HX|Hong Kong Airlines|airline
UO|HK Express|airline
MH|Malaysia Airlines|airline
AK|AirAsia|airline
D7|AirAsia X|airline
TG|Thai Airways|airline
FD|Thai AirAsia|airline
PG|Bangkok Airways|airline
GA|Garuda Indonesia|airline
PR|Philippine Airlines|airline
5J|Cebu Pacific|airline
VN|Vietnam Airlines|airline
VJ|VietJet Air|airline
NH|All Nippon Airways (ANA)|airline
JL|Japan Airlines|airline
KE|Korean Air|airline
OZ|Asiana Airlines|airline
CA|Air China|airline
MU|China Eastern Airlines|airline
CZ|China Southern Airlines|airline
HU|Hainan Airlines|airline
3U|Sichuan Airlines|airline
MF|Xiamen Airlines|airline
CI|China Airlines|airline
BR|EVA Air|airline
AI|Air India|airline
IX|Air India Express|airline
6E|IndiGo|airline
SG|SpiceJet|airline
QP|Akasa Air|airline
UL|SriLankan Airlines|airline
BG|Biman Bangladesh Airlines|airline
BS|US-Bangla Airlines|airline
RA|Nepal Airlines|airline
KB|Druk Air|airline
8M|Myanmar Airways International|airline
FJ|Fiji Airways|airline
QF|Qantas|airline
VA|Virgin Australia|airline
JQ|Jetstar Airways|airline
NZ|Air New Zealand|airline
ET|Ethiopian Airlines|airline
KQ|Kenya Airways|airline
SA|South African Airways|airline
AT|Royal Air Maroc|airline
WB|RwandAir|airline
TU|Tunisair|airline
AH|Air Algerie|airline
P4|Air Peace|airline
KP|ASKY Airlines|airline
HF|Air Cote d'Ivoire|airline
TC|Air Tanzania|airline
`;

export interface AirlineSeedRecord {
  code: string;
  name: string;
  kind: "airline" | "alliance";
}

export function getAirlineSeed(): AirlineSeedRecord[] {
  const byCode = new Map<string, AirlineSeedRecord>();

  RAW.split("\n").forEach((line) => {
    const [code, name, kind] = line.split("|").map((part) => part?.trim());
    if (!code || !name || byCode.has(code)) return;
    byCode.set(code, { code, name, kind: kind === "alliance" ? "alliance" : "airline" });
  });

  return Array.from(byCode.values());
}
