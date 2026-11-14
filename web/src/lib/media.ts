/**
 * Photographs, footage and drawings used on the site.
 *
 * Photographs and footage are NASA's own. The line drawings of cabins, scenes and fire-safety
 * jobs, their animated versions and the two turnable white models are concept illustrations
 * made with image and video models through Higgsfield; they explain an idea and are never
 * presented as evidence.
 */

export type Photo = { src: string; alt: string; caption: string; width: number; height: number; /** NASA's own page for the picture. */ source?: string };

const nasa = (id: string) => `https://images.nasa.gov/details/${id}`;

const ACME_HARDWARE: Photo = { src: "/img/acme-hardware.jpg", alt: "Close view of the ACME burner hardware and its instruments.", caption: "The ACME hardware this experiment used. NASA photograph, from PSI.", width: 1280, height: 853 };
const SAFFIRE: Photo = { src: "/video/saffire-vi-poster.jpg", alt: "A flame spreading along a sheet of acrylic in microgravity.", caption: "A later flight of the same series, Saffire-VI. NASA Glenn Research Center.", width: 1120, height: 534 };
const BASS2: Photo = { src: "/img/bass2-flame.jpg", alt: "A plastic rod burning in a gentle airflow on the International Space Station.", caption: "A rod burning in BASS-II. NASA photograph, from PSI.", width: 1200, height: 797 };
const BASS: Photo = { src: "/img/bass-msg.jpg", alt: "An astronaut works with both arms inside the glovebox on the space station.", caption: "Astronaut Don Pettit runs a BASS session in the glovebox, March 2012. NASA photograph iss030e178648.", width: 1280, height: 850, source: nasa("iss030e178648") };
const FLEX: Photo = { src: "/img/flex-mdca.jpg", alt: "An astronaut works on the droplet combustion hardware on the space station.", caption: "Astronaut Michael Fincke works on the droplet combustion apparatus that FLEX used, December 2008. NASA photograph iss018e010645.", width: 1280, height: 850, source: nasa("iss018e010645") };
const SAME: Photo = { src: "/img/same-2007.jpg", alt: "An astronaut works at the glovebox on the space station.", caption: "Astronaut Clay Anderson works on the SAME hardware in the glovebox, September 2007. NASA photograph iss015e27411.", width: 1280, height: 850, source: nasa("iss015e27411") };
const SPICE: Photo = { src: "/img/spice-msg.jpg", alt: "An astronaut floats beside a laptop and the glovebox on the space station.", caption: "Astronaut Michael Barratt starts a SPICE session, April 2009. NASA photograph iss019e012391.", width: 1280, height: 850, source: nasa("iss019e012391") };

/** One NASA photograph for each of the 24 investigations. A study with no hardware of its own shows the flight experiment it worked from, and says so. */
export const EXPERIMENT_PHOTO: Record<string, Photo> = {
  "PSI-10": { src: "/img/flame-design-stages.jpg", alt: "Nine spherical flames at different stages, from blue to sooty yellow.", caption: "Spherical flames from Flame Design. NASA photograph, from PSI.", width: 574, height: 575 },
  "PSI-159": { src: "/img/cfig-cool-flames.jpg", alt: "A spherical flame around a small porous burner.", caption: "A spherical flame on the CFI-G burner. NASA photograph, from PSI.", width: 364, height: 364 },
  "PSI-22": { src: "/img/efield-blue.jpg", alt: "A blue, dome-shaped flame flattened by an electric field.", caption: "A flame shaped by an electric field. NASA photograph, from PSI.", width: 686, height: 564 },
  "PSI-20": { src: "/img/acme-cir-2019.jpg", alt: "An astronaut works at the open Combustion Integrated Rack on the space station.", caption: "Astronaut David Saint-Jacques services the rack that ran the ACME gas-flame experiments, February 2019. NASA photograph iss058e026380.", width: 1280, height: 853, source: nasa("iss058e026380") },
  "PSI-21": { src: "/img/acme-insert.jpg", alt: "An engineer looks closely at a gas burner inside the ACME hardware.", caption: "The gas-jet burner inside the ACME insert, inspected at NASA Glenn in June 2016. NASA photograph GRC-2016-C-05051.", width: 1280, height: 960, source: nasa("GRC-2016-C-05051") },
  "PSI-23": ACME_HARDWARE,
  "PSI-25": BASS2,
  "PSI-26": BASS,
  "PSI-39": { src: "/img/cfi-setup.jpg", alt: "An astronaut holds the cylindrical droplet combustion hardware on the space station.", caption: "Astronaut Shane Kimbrough sets the droplet hardware up for the Cool Flames Investigation, January 2017. NASA photograph iss050e035112.", width: 1280, height: 851, source: nasa("iss050e035112") },
  "PSI-47": { src: "/img/daft.jpg", alt: "An astronaut works with the DAFT instrument beside a foil bag on the space station.", caption: "Astronaut Jeffrey Williams works with DAFT, August 2006. NASA photograph iss013e69250.", width: 1280, height: 850, source: nasa("iss013e69250") },
  "PSI-60": { ...SPICE, caption: "SPICE, the flight experiment whose photographs this study re-analysed. Astronaut Michael Barratt starts a session, April 2009. NASA photograph iss019e012391." },
  "PSI-62": { ...BASS, caption: "BASS, the flight experiment this study modelled. Astronaut Don Pettit runs a session, March 2012. NASA photograph iss030e178648." },
  "PSI-68": { src: "/img/flex2-reservoir.jpg", alt: "An astronaut reaches into the droplet combustion hardware, pulled partly out of its chamber.", caption: "Astronaut Chris Cassidy changes a fuel reservoir for FLEX-2, April 2013. NASA photograph iss035e017702.", width: 1280, height: 850, source: nasa("iss035e017702") },
  "PSI-69": FLEX,
  "PSI-98": { src: "/img/saffire1.jpg", alt: "A team in clean-room suits stands behind the boxed Saffire-I experiment, beside a Cygnus cargo module.", caption: "Saffire-I before launch, at Kennedy Space Center in January 2016. NASA photograph jsc2016e017570.", width: 1280, height: 960, source: nasa("jsc2016e017570") },
  "PSI-99": SAFFIRE,
  "PSI-100": { src: "/img/saffire3.jpg", alt: "A large white box strapped down inside a cargo spacecraft, with caution labels.", caption: "Saffire-III inside its Cygnus cargo spacecraft, May 2017. NASA photograph iss051e039882.", width: 1280, height: 851, source: nasa("iss051e039882") },
  "PSI-101": { src: "/img/same-r-2010.jpg", alt: "An astronaut works with her arm inside the glovebox on the space station.", caption: "Astronaut Shannon Walker works with the SAME hardware in the glovebox, July 2010. NASA photograph iss024e008351.", width: 1280, height: 850, source: nasa("iss024e008351") },
  "PSI-102": SAME,
  "PSI-106": { src: "/img/slice-msg.jpg", alt: "An astronaut works at the glovebox, seen from behind.", caption: "Astronaut Don Pettit works with SLICE at the glovebox, March 2012. NASA photograph iss030e128918.", width: 1280, height: 850, source: nasa("iss030e128918") },
  "PSI-107": SPICE,
  "PSI-115": { ...SAME, caption: "SAME, the flight experiment this study used as its reference. Astronaut Clay Anderson at the hardware, September 2007. NASA photograph iss015e27411." },
  "PSI-117": { ...FLEX, caption: "The hardware of FLEX, the flight experiment this study simulated. NASA photograph iss018e010645, December 2008." },
  "PSI-142": { ...FLEX, caption: "The hardware of FLEX, the flight experiment this study follows up. NASA photograph iss018e010645, December 2008." },
};

export const FAMILY_PHOTO: Record<string, Photo> = {
  acme: { ...EXPERIMENT_PHOTO["PSI-10"], caption: "Spherical flames from Flame Design, one of the six ACME experiments. NASA photograph." },
  "msg-duct": { ...BASS2, caption: "A rod burning in the flow duct during BASS-II. NASA photograph." },
  saffire: { ...SAFFIRE, caption: "A sheet of acrylic burning in Saffire-VI, a later flight. NASA Glenn Research Center." },
};

/** Concept illustrations, keyed by cabin or by fire-safety job. */
export const CABIN_ART: Record<string, { src: string; alt: string }> = {
  cabin: { src: "/illustrations/cabin-station.jpg", alt: "Drawing of a space station module with an astronaut floating inside." },
  station: { src: "/illustrations/cabin-station.jpg", alt: "Drawing of a space station module with an astronaut floating inside." },
  airlock: { src: "/illustrations/cabin-rover.jpg", alt: "Drawing of a pressurized rover on the Moon with two astronauts inside." },
  "pressurized-rover": { src: "/illustrations/cabin-rover.jpg", alt: "Drawing of a pressurized rover on the Moon with two astronauts inside." },
  exploration: { src: "/illustrations/cabin-lunar.jpg", alt: "Drawing of a lunar surface habitat, cut away to show an astronaut at a workbench." },
  "lunar-habitat": { src: "/illustrations/cabin-lunar.jpg", alt: "Drawing of a lunar surface habitat, cut away to show an astronaut at a workbench." },
  spacesuit: { src: "/illustrations/cabin-suit.jpg", alt: "Drawing of an astronaut in a spacesuit standing on the Moon." },
  suit: { src: "/illustrations/cabin-suit.jpg", alt: "Drawing of an astronaut in a spacesuit standing on the Moon." },
};

export const JOB_ART: Record<string, { src: string; alt: string }> = {
  prevention: { src: "/illustrations/job-prevention.jpg", alt: "Drawing of a fabric sample in a test frame with a small flame at its edge." },
  detection: { src: "/illustrations/job-detection.jpg", alt: "Drawing of a smoke detector with a curl of smoke drifting toward it." },
  suppression: { src: "/illustrations/job-suppression.jpg", alt: "Drawing of a fire extinguisher spraying mist at a small flame." },
};

export const ART_NOTE = "Drawings, their animations and the white models are SI-generated concept illustrations, each marked. Photographs and footage are NASA's.";
