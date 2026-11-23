import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import QddReviewPage from './qdd-review/QddReviewPage.jsx'
import { QDD_REVIEW_PAGE_ID, QDD_REVIEW_PATH } from './qdd-review/config.js'
import fallbackContent from './data/content-fallback.json'
import {
  NOT_FOUND_PAGE_ID,
  PAGE_META as PUBLIC_PAGE_META,
  PUBLIC_ROUTES,
  normalizePathname,
  pageIdForPublicPath,
  resolvePageMeta
} from './site/routes.js'
import { ArrowUpRight, Mail, MapPin, Trophy } from 'lucide-react'
import HomeView from './components/HomeView.jsx'
import ResearchView from './components/ResearchView.jsx'
import PeopleView from './components/PeopleView.jsx'
import PublicationsView from './components/PublicationsView.jsx'
import FacilitiesView from './components/FacilitiesView.jsx'
import NewsView from './components/NewsView.jsx'
import OpportunitiesView from './components/OpportunitiesView.jsx'
import ContactView from './components/ContactView.jsx'
import NotFoundView from './components/NotFoundView.jsx'
import SiteHeader from './components/SiteHeader.jsx'
import SiteFooter from './components/SiteFooter.jsx'
import { NavContext } from './site/nav.jsx'
import { getRecruitmentState, nextRecruitmentChange } from './site/recruitment.js'
import { useNow } from './site/useNow.js'

const ALL_ROUTES = PUBLIC_ROUTES

const QDD_EXHIBITOR_SHOP_URL =
  'https://onlineshop.shef.ac.uk/conferences-and-events/faculty-of-engineering/electronic-electrical-engineering/quantum-dot-day-26th-november-2026-sponsorship-packages'

const QDD_IOP_OPTICAL_GROUP_URL =
  'https://www.iop.org/physics-community/special-interest-groups/optical-group'

const QDD_IOP_QEP_GROUP_URL =
  'https://www.iop.org/physics-community/special-interest-groups/quantum-electronics-photonics-group'

const QDD_PI_KEM_URL = 'https://www.pi-kem.co.uk'

const QDD_AEGIQ_URL = 'https://www.aegiq.com'

const QDD_QUANTUM_DESIGN_URL = 'https://www.qd-uki.co.uk'

const QDD_OXFORD_INSTRUMENTS_URL = 'https://www.oxinst.com'

const QDD_ROBQUANT_URL = 'https://robquant.com'

const QDD_SESSIONS = [
  'Epitaxy / III–V emitters',
  'Colloidal / soft-matter',
  'Colour centres / defects',
  'Optics / integration / devices'
]

const QDD_CONFIRMED_INVITEDS = [
  {
    name: 'Fei Ding',
    institution: 'Leibniz University Hannover',
    session: 'Epitaxy / III–V emitters',
    url: 'https://www.fkp.uni-hannover.de/en/research-groups/group-ding'
  },
  {
    name: 'Helena Knowles',
    institution: 'University of Cambridge',
    session: 'Colour centres / defects',
    url: 'https://www.phy.cam.ac.uk/profile/dr-helena-knowles/'
  },
  {
    name: 'Sandrine Ithurria',
    institution: 'ESPCI Paris',
    session: 'Colloidal / soft-matter',
    url: 'https://blog.espci.fr/qdots/people/ithurria-2/'
  },
  {
    name: 'Tim Schröder',
    institution: 'Humboldt-Universität zu Berlin',
    session: 'Optics / integration / devices',
    url: 'https://www.physik.hu-berlin.de/en/iqp'
  }
]

const QDD_COMMITTEE = [
  { name: 'Anthony Bennett', institution: 'Cardiff University' },
  { name: 'Alistair J. Brash', institution: 'University of Sheffield' },
  { name: 'Edmund Clarke', institution: 'University of Sheffield' },
  { name: 'Mark Fox', institution: 'University of Sheffield' },
  { name: 'J.P. Hadden', institution: 'Cardiff University' },
  { name: 'Edmund Harbord', institution: 'University of Bristol' },
  { name: 'Bo Hou', institution: 'Cardiff University' },
  { name: 'Jake Iles-Smith', institution: 'University of Sheffield' },
  { name: 'Elyahou Kapon', institution: 'EPFL' },
  { name: 'Rachel A. Oliver', institution: 'University of Cambridge' }
]

// ---- Quantum Dot Day 2026 programme (paste below QDD_COMMITTEE in src/App.jsx) ----
// All times UK (GMT). Invited 30 min, contributed 15 min.
const QDD_PROGRAMME = [
  { type: 'break', time: '09:00', end: '09:30', title: 'Registration and coffee' },
  { type: 'break', time: '09:30', end: '09:35', title: 'Welcome' },
  {
    type: 'session',
    numeral: 'I',
    time: '09:35',
    end: '11:05',
    title: 'Epitaxy / III–V emitters',
    chair: 'Edmund Harbord (University of Bristol)',
    talks: [
      { time: '09:35', speaker: 'Fei Ding', institution: 'Leibniz University Hannover', title: 'Connecting the Dots: From Semiconductor Quantum Emitters to Quantum Networks', invited: true },
      { time: '10:05', speaker: 'Chunyu Zhao', institution: 'University of Cambridge', title: 'Polarised Cathodoluminescence Properties of InGaN Quantum Dots Grown by Modified Droplet Epitaxy', invited: false },
      { time: '10:20', speaker: 'Guoliang Zhou', institution: 'University of Sheffield', title: 'Site-control of InAs quantum dots on InP by droplet epitaxy in MOVPE', invited: false },
      { time: '10:35', speaker: 'Valdemar Bille-Lauridsen', institution: 'Technical University of Denmark (DTU)', title: 'Lithographically defined quantum-dot-scale active regions in InP nanocavities', invited: false },
      { time: '10:50', speaker: 'Christopher Broderick', institution: 'Tyndall National Institute, University College Cork', title: 'The QUantum Dot Open-source Simulator (QUDOS)', invited: false },
    ]
  },
  { type: 'break', time: '11:05', end: '11:30', title: 'Coffee and posters' },
  {
    type: 'session',
    numeral: 'II',
    time: '11:30',
    end: '13:00',
    title: 'Colloidal / soft-matter',
    chair: 'Bo Hou (Cardiff University)',
    talks: [
      { time: '11:30', speaker: 'Sandrine Ithurria', institution: 'ESPCI Paris', title: 'II-VI semiconductor nanoplatelets: an hybrid inorganic-organic playground', invited: true },
      { time: '12:00', speaker: 'Sruthi Raj Sreeraj', institution: 'University of Manchester', title: 'Nanocrystals Doped by Single Rare Earth Ions for Quantum Memories and Repeaters', invited: false },
      { time: '12:15', speaker: 'Peter Matthews', institution: 'Keele University', title: 'InProving QDs: Controlling the size and emission quality of InP', invited: false },
      { time: '12:30', speaker: 'Charlotte Eling', institution: 'University of Strathclyde', title: 'Beyond Individual Quantum Dots: Self-Assembled Supraparticles for Lasing, Sensing, and Integrated Photonics', invited: false },
      { time: '12:45', speaker: 'Sri Datta Aneesh Chodavarapu', institution: 'Cardiff University', title: 'Inkjet Printed Colloidal Quantum Dot Opto-electronics for Visible Light Communication and Optical Interconnects applications', invited: false },
    ]
  },
  { type: 'break', time: '13:00', end: '13:50', title: 'Lunch and posters' },
  {
    type: 'session',
    numeral: 'III',
    time: '13:50',
    end: '15:05',
    title: 'Colour centres / defects',
    chair: 'J.P. Hadden (Cardiff University)',
    talks: [
      { time: '13:50', speaker: 'Helena Knowles', institution: 'University of Cambridge', title: 'Spins in diamond for quantum sensing and quantum simulation', invited: true },
      { time: '14:20', speaker: 'Anne-Sophie Korotov', institution: 'University of Oxford', title: 'Scalable fabrication of microlenses in diamond membranes for efficient photonic interfaces in quantum networks', invited: false },
      { time: '14:35', speaker: 'Kieran Ramaswami', institution: 'University of Manchester', title: 'Generation and high-throughput down-selection of lead-vacancy centres in nanodiamonds for non-classical emitters', invited: false },
      { time: '14:50', speaker: 'Maxim Makhonin', institution: 'University of Sheffield', title: 'NV Centres Photoluminescence Enhancement in diamond by confined excitation in a Heterogeneously Integrated Planar DBR Cavity', invited: false },
    ]
  },
  { type: 'break', time: '15:05', end: '15:30', title: 'Coffee and posters' },
  {
    type: 'session',
    numeral: 'IV',
    time: '15:30',
    end: '16:30',
    title: 'Optics / integration / devices',
    chair: 'Joe A. Smith (University of Sheffield)',
    talks: [
      { time: '15:30', speaker: 'Tim Schröder', institution: 'Humboldt-Universität zu Berlin', title: 'Integrated Quantum Photonics: Devices, Circuits, and Quantum Interfaces', invited: true },
      { time: '16:00', speaker: 'Savvas Germanis', institution: 'University of Sheffield', title: 'Electrical Control of Chiral Emission from a Single InAs Quantum Dot in a Glide-Plane Photonic Crystal Waveguide', invited: false },
      { time: '16:15', speaker: 'Alfie Broughton', institution: 'Cardiff University', title: 'Single-photon frequency combs for quantum networking using a single mode photonic crystal fibre', invited: false },
    ]
  },
  { type: 'break', time: '16:30', end: '16:40', title: 'Closing remarks and poster prizes' },
  { type: 'break', time: '16:40', end: '17:00', title: 'Close (venue clear by 17:00)' }
]

const QDD_POSTERS = [
  { theme: 'Epitaxy / III–V emitters', speaker: 'Benyam Dejen', institution: 'University of Cambridge', title: 'Towards single-shot readout of a cavity-coupled quantum dot qubit' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'William Marsden', institution: 'University of Sheffield', title: 'Spatial and spectral characterisation of low density GaAs/AlGaAs multi-quantum dot sites grown by local-droplet epitaxy' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Sion Meredith', institution: 'University of Manchester', title: 'Efficient optimisation of multi-parameter quantum control protocols for strongly-coupled systems' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Toby Rawlings', institution: 'University of Sheffield', title: 'Resonant Photon Correlation Noise Spectroscopy of Single Quantum Emitters' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Elisa M Sala', institution: 'University of Sheffield', title: 'Exploring the MOVPE growth of Droplet Epitaxy InAs/InP Quantum Dots for Quantum Photonic Applications' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Mateusz Salamon', institution: 'University of Manchester', title: 'Influence of Phonon Interactions on Frequency-Filtered Multi-Photon Correlations from Quantum Dots' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Alex Thomas', institution: 'University of Bristol', title: 'Partially Etched Pillars' },
  { theme: 'Colloidal / soft-matter', speaker: 'Renesa Dasgupta', institution: 'King\'s College London', title: 'Engineering gold-based quantum dots for image guided surgery in glioblastoma' },
  { theme: 'Colloidal / soft-matter', speaker: 'Robert Dimitrov', institution: 'Cardiff University', title: 'Elemental Doping of InP Colloidal Quantum Dots: A Step Towards Room-Temperature Ferromagnetism in Quantum Dots' },
  { theme: 'Colloidal / soft-matter', speaker: 'Charlotte Eling', institution: 'University of Strathclyde', title: 'A Quantum Dot-Based Platform for Optical Detection and Photocatalytic Elimination of Wound Pathogens' },
  { theme: 'Colloidal / soft-matter', speaker: 'Christian Maddox', institution: 'University of Manchester', title: 'Silver Source Injection Approach to Synthesis of Five-Metal (AgInGaMnZn)S Quantum Dots' },
  { theme: 'Colloidal / soft-matter', speaker: 'Angelos Seizas', institution: 'Cardiff University', title: 'Symmetry-resolved phonon-mediated dark-to-bright exciton transitions in wurtzite CdSe quantum dots' },
  { theme: 'Colour centres / defects', speaker: 'Teymour Talha-Dean', institution: 'University of Sheffield', title: 'NV centers for the dynamic tracking of magnetically labelled bacteria' },
  { theme: 'Colour centres / defects', speaker: 'Jack Wall', institution: 'University of Sheffield', title: 'The Transition into Industrial-Standard NV Centre Thermometers' },
  { theme: 'Optics / integration / devices', speaker: 'Anatoliy Antill', institution: 'University of Sheffield', title: 'NV Center Enhancement Using a Heterogeneously Integrated Planar-Planar DBR Cavity' },
  { theme: 'Optics / integration / devices', speaker: 'Rohin Bardhan', institution: 'University of Manchester', title: 'A Photonic Structure for a Colloidal Quantum Dot based Quantum Information Device' }
]

// Talk abstracts, word for word from the printed programme booklet (v11, 20 Nov 2026). Keyed by talk start time.
// Static, trusted HTML (p, ol/li, sup, b, span only).
const QDD_TALK_ABSTRACTS = {
  "09:35": { speaker: "Fei Ding", authors: "<span><b>Fei Ding</b></span> <span>Leibniz University Hannover, Germany</span>", html: "<p>A quantum dot is not merely a quantum light source, but a building block for a distributed quantum network. It offers deterministic generation of single and entangled photons. However, transforming individual quantum emitters into a functional network requires more than high-quality photon generation: it demands reliable quantum-state encoding, transmission, interference, and even synchronization across distant nodes.</p><p>In this talk, I will briefly review our works in the past years and also present our recent progress, from high-quality material growth, strain engineering, entanglement swapping with semiconductor-generated photons to recent advances in telecom-wavelength quantum communication. In particular, I will highlight experiments on the “Niedersachsen Quantum Link” with semiconductor quantum dots, including polarization and time-bin encoded quantum key distribution over the intercity 120 km of optical fiber and high precision time/frequency synchronization. These results illustrate the growing potential of semiconductor quantum dots for practical quantum communication.</p>" },
  "11:30": { speaker: "Sandrine Ithurria", authors: "<span><b>Sandrine Ithurria</b><sup>1</sup></span> <span><sup>1</sup> Laboratoire de Physique et d’Etude des Matériaux, ESPCI, PSL Research University, Sorbonne Université, CNRS, 10 rue Vauquelin, 75005 Paris, France.</span>", html: "<p>Semiconductor nanoplatelets present narrow optical properties thanks to their thickness, defined at the atomic scale without roughness. It makes them appealing for optoelectronic devices. Besides their basal facets are extended over 1000s of nm<sup>2</sup> which make them appealing for the self-assembly of molecules.<sup>1</sup></p><p>Here, we will first show with the synthesis of heterostructures, it is possible to grow NPLs with more than one emission thus breaking the Kasha’s rule. With core/crown/crown CdSe/CdTe/CdSe NPLs composed at 95% of CdSe, a dual emission is obtained where a green emission arises from the recombination of the exciton through the band edge in 4 ML CdSe NPLs while a red emission arises from the type II band alignment between CdSe and CdTe.<sup>2</sup> Other heterostructures have then been synthesized to further improve the Quantum yield and the emission linewidth.<sup>3</sup> These NPLs can be introduced in light emitting diodes which exhibit dual NPLs as in the active materials. More recently, we introduced these bi-color NPLs into a dielectric photonic cavity, allowing the spectral linewidth to be controlled and reduced to 2 nm.<sup>4</sup></p><p>Finally, I will show that pristine ligands can be exchanged with chiral ligands, in the aim of circular dichroism optical properties.<sup>5</sup> We are showing a direct ligand exchange in ethanol from carboxylate to tartrate ligands, inducing the self-assembly of the tartrate ligands in two different conformations exhibiting opposite circular dichroism signals. The emergence of the circular dichroism optical properties comes from a good coupling of the ligands on the surface and an orthorhombic crystal distortion. The dissymmetric factor can reach values as high as 1.2% for extended NPLs.</p><ol><li>BT Diroll, B Guzelturk, H Po, C Dabard, N Fu, L Makke, E Lhuillier, S Ithurria, Chemical Reviews, 2023, 123 (7), 3543-3624</li><li>C Dabard, V Guilloux, C Gréboval, H Po, L Makke, N Fu, XZ Xu, MG Silly, G Patriarche, E Lhuillier, T Barisien, J I Climente, B T Diroll, S Ithurria, Nature Communications, 2022, 13 (1), 5094</li><li>C Dabard, H Po, N Fu, L Makke, H Lehouelleur, L Curti, XZ Xu, E Lhuillier, B Diroll, S Ithurria, Nanoscale 15 (35), 14651-14658</li><li>Oh et al., submitted</li><li>H Lehouelleur, H Po, L Makké, N Fu, L Curti, C Dabard, C Roux-Byl, B Baptiste, N J Van Zee, T Pons, E Lhuillier, J Li, S Ithurria, Journal of the American Chemical Society 146 (45), 30871-30882</li></ol>" },
  "13:50": { speaker: "Helena Knowles", authors: "", html: "<p>Spin-based quantum devices harnessing nitrogen-vacancy centres in diamond offer room temperature access to quantum phenomena and high degree of control over electronic and nuclear spins. I will present our latest results on nanoscale, microkelvin resolution thermometry and its potential applications to life sciences.<sup>1-3</sup> I will also highlight how the diamond platform can be used to simulate complex many-body dynamics and present a platform that allows us to study fundamental quantum thermodynamics phenomena.<sup>4-5</sup></p><ol><li>Q. Gu et al., ACS Nano 2023, 17 (2023) 20034−20042</li><li>L. Shanahan et al., PRX LIFE 3, 013016 (2025)</li><li>J. Hart et al., arXiv:2609.04907 (2026)</li><li>S. Pal et al., Physical Review Research 2025, 7, 033287.</li><li>S. Pal et al., arXiv:2609.04905 (2026)</li></ol>" },
  "15:30": { speaker: "Tim Schröder", authors: "", html: "<p>Integrated quantum photonics aims to combine quantum emitters, nanophotonic devices, and photonic circuitry within scalable architectures. A central challenge is to engineer efficient interfaces between solid-state quantum systems and well-defined optical modes, while preserving coherence and enabling integration into larger photonic systems.</p><p>In this talk, I will present our work on integrated photonic devices for solid-state quantum emitters, with a focus on color centers in diamond. I will discuss nanophotonic cavities and waveguides for enhancing light–matter interaction and photon collection, approaches for interfacing these devices with optical fibers and photonic circuits, and coherent optical control of the underlying quantum systems. Such platforms combine efficient single-photon generation with access to long-lived spin states that can serve as local quantum memories. I will discuss how these elements can be brought together towards integrated quantum photonic circuits in which solid-state emitters provide sources and memories, while photons connect individual quantum nodes.</p>" },
  "10:05": { speaker: "Chunyu Zhao", authors: "<span><b>Chunyu Zhao</b>, University of Cambridge</span> <span>Zeki S. Pehlivan, University of Cambridge</span> <span>Xin Liu, University of Cambridge</span> <span>Gunnar Kusch, University of Cambridge</span> <span>Menno J. Kappers, University of Cambridge</span> <span>Rachel A. Oliver, University of Cambridge</span>", html: "<p>InGaN quantum dots (QDs) are highly promising for quantum photonics at accessible temperatures due to their large exciton binding energies. Polarised photons are a crucial resource for the application of single photon sources in quantum cryptography and polarised emission has previously been demonstrated using non-polar m-plane and a-plane InGaN QDs. However, conventional polar c-plane InGaN QDs have a symmetric in-plane geometry and are hence expected to emit unpolarised light. Here we demonstrate that c-plane InGaN QDs can exhibit substantial polarisation anisotropy by leveraging preferential nucleation along template step edges. The InGaN QDs are grown on a terraced GaN template with a root mean square roughness (Rq) of 0.2 nm using a modified droplet epitaxy method. In this method, nitrogen annealing forms In/Ga droplets, which are then converted to QDs by ammonia exposure. The QDs are observed to nucleate along GaN step edges. Low-temperature (10K) cathodoluminescence (CL) spectra taken on capped samples reveal sharp emission lines with a full width at half maximum (FWHM) down to 5 meV. Polarised CL measurements at 80K reveal that emission is typically polarised parallel to the dominant step edge direction. Individual emission peaks exhibit a degree of linear polarisation as high as 88%. Spatial fluctuations in emission energy and polarisation are also observed, pointing to local variations in QD morphology or indium composition. By demonstrating a route to achieve polarised emission in c-plane geometries, these results advance the integration of c-plane InGaN QDs into quantum photonic applications at practically accessible cryogenic temperatures.</p>" },
  "10:20": { speaker: "Guoliang Zhou", authors: "<span><b>Guoliang Zhou</b>, Department of Electronic and Electrical Engineering, The University of Sheffield</span> <span>Elisa M. Sala — Department of Electronic and Electrical Engineering, The University of Sheffield; EPSRC National Epitaxy Facility, The University of Sheffield</span> <span>Young In Na — Department of Electronic and Electrical Engineering, The University of Sheffield; EPSRC National Epitaxy Facility, The University of Sheffield</span> <span>Paul Fry — Department of Electronic and Electrical Engineering, The University of Sheffield; EPSRC National Epitaxy Facility, The University of Sheffield</span> <span>Dominic J. Hallett — School of Mathematical and Physical Sciences, The University of Sheffield</span> <span>Alistair J. Brash — School of Mathematical and Physical Sciences, The University of Sheffield</span> <span>L. R. Wilson — School of Mathematical and Physical Sciences, The University of Sheffield</span> <span>Jon Heffernan — Department of Electronic and Electrical Engineering, The University of Sheffield; EPSRC National Epitaxy Facility, The University of Sheffield</span>", html: "<p>We investigate the site-controlled growth of InAs/InP quantum dots (QDs) fabricated by droplet epitaxy (DE) in metal-organic vapour phase epitaxy (MOVPE) [1]. InAs/InP QDs emit at ~1.55 µm, within the telecom C-band where optical signals experience minimal attenuation [2], making them ideal single-photon emitters (SPEs) for applications in quantum communication and quantum information technologies. Droplet epitaxy relies on the formation of metallic droplets which are subsequently crystallized into uniform and symmetric QDs, potentially reducing fine-structure splitting (FSS). To achieve deterministic positioning of QDs, substrate pre-patterning techniques have been developed to enable site-controlled growth, allowing low dot densities and scalability for quantum photonic devices.</p><p>In this work, the process of fabricating nanohole arrays using electron beam lithography (EBL) and novel nanoimprint lithography (NIL) were explored. Subsequent DE growth in MOVPE produced QDs localized within the nanoholes. Samples are characterized by atomic force microscopy (AFM), which reveals physical site control of Indium droplets and QDs on a nano-scale along with their morphological properties. Micro-photoluminescence (µPL) imaging and spectroscopy respectively provide occupancy and linewidth analysis.</p><p>Here, we demonstrate nanoscale, deterministic site-controlled InAs/InP QDs emitting in the telecom C-band. Using the DE method in MOVPE, we achieved one QD per site, with an occupancy rate as high as 83%, and narrow linewidths of 50 µeV or less for over 60% of the measured QDs - indicating this approach is highly suitable for quantum nanophotonic applications [3].</p>" },
  "10:35": { speaker: "Valdemar Bille-Lauridsen", authors: "<span><b>Valdemar Bille-Lauridsen</b>, Technical University of Denmark</span> <span>Meng Xiong, Technical University of Denmark</span> <span>Elizaveta Semenova, Technical University of Denmark</span> <span>Kresten Yvind, Technical University of Denmark</span> <span>Jesper Mørk, Technical University of Denmark</span>", html: "<p>Shrinking semiconductor lasers toward the nanoscale requires precise spatial overlap between the optical cavity and an increasingly small gain region. Self-assembled quantum dots (QDs) provide excellent emission properties, but their stochastic nucleation limits spatial alignment, fabrication yield, and scalability [1]. Buried heterostructures (BHs) provide a good alternative by combining lithographic control of the active region with three-dimensional carrier confinement.</p><p>Here, we demonstrate lasing from an InP photonic-crystal nanobeam cavity incorporating a BH with an estimated lateral footprint of approximately 107 × 107 nm², the smallest laterally confined BH active region reported to lase. Despite the large surface-to-volume ratio and etching through the active region during cavity etching, the devices exhibit a clear lasing threshold and narrow linewidth under optical pumping. Al₂O₃ surface passivation and strong optical confinement in the high-Q nanobeam cavity enable this performance. By systematically varying the BH size, we show how the lasing threshold depends on active-region volume, pump overlap, and optical confinement, in agreement with rate-equation modelling.</p><p>We further demonstrate BH structures with lateral dimensions down to approximately 40 × 40 nm², placing them in the size regime of other telecom quantum dots [3]. This provides a promising route towards deterministic emitters for quantum-photonic devices, with precise lithographic control over active-region size and position.</p><ol><li>[1] Sapienza, L. et al., Nature Communications, 6, 7833 (2015)</li><li>[2] Dimopoulos, E. et al., Optica, 10, 973 (2023)</li><li>[3] Zhang, Z, et al. Scientific Reports 2, 477 (2012)</li></ol>" },
  "10:50": { speaker: "Christopher Broderick", authors: "<span><b>Christopher Broderick</b>, School of Physics and Tyndall National Institute, University College Cork, Ireland</span> <span>Tommy Murphy, Tyndall National Institute and School of Physics, University College Cork, Ireland</span> <span>Eoin P. O’Reilly, Tyndall National Institute and School of Physics, University College Cork, Ireland</span>", html: "<p>Quantum dots (QDs) represent a frontier of semiconductor research, with emerging applications spanning classical, quantum and topological photonics, high-efficiency photovoltaics, and spin-photon interfaces. Accurate simulation of QD electronic structure is essential to inform growth and characterisation, and underpin engineering of enhanced properties for QD-based devices. A combination of physical transparency and computational efficiency has established the multi-band k.p method as the de facto standard framework to simulate QD properties. We present the QUantum Dot Open-source Simulator, QUDOS: a robust, flexible and numerically efficient code that computes epitaxial QD electronic structure via an 8-band k.p Hamiltonian, including spin-orbit coupling, strain, and piezoelectric effects. QUDOS employs a semi-analytical plane-wave expansion method that allows the QD strain fields, piezoelectric potential, applied electric field, and Hamiltonian matrix to be evaluated analytically in reciprocal space. By supporting a variety of QD shapes, which can be arbitrarily positioned, oriented, and combined in a user-defined calculational supercell, QUDOS can treat nanostructures ranging from simple single QDs to complex morphologies including QD molecules, superlattices, QD-in-a-well systems, and beyond. Computational efficiency is delivered by leveraging high-performance open-source eigensolver and fast Fourier transform routines, which mitigate numerical bottlenecks by respectively accelerating exact Hamiltonian diagonalisation and evaluation of reciprocal-space convolutions. Amongst QUDOS’s outputs are the single-particle QD eigenstate energies and wave functions, in addition to optical (momentum) and Coulomb (direct and exchange) matrix elements between QD eigenstates. This provides the quantities required to establish predictive semi-classical or many-body calculations of QD properties, to underpin fundamental theoretical analysis and practical device design.</p>" },
  "12:00": { speaker: "Sruthi Raj Sreeraj", authors: "<span><b>Sruthi Raj Sreeraj</b>, University of Manchester</span> <span>Prof. David Binks and Prof. David Lewis</span>", html: "<p>Nanocrystals offer an attractive platform for spin–photon interfaces by combining useful optical properties with a substrate-free nanoscale positioning. Here, we report the synthesis of Er³⁺-doped yttrium oxide (Y₂O₃) nanocrystals using a combined sol–gel method with a molecular-seeding approach. Well-defined erbium-doped yttrium clusters were synthesised, and mass spectrometry and single-crystal X-ray diffraction results showed strong evidence that they contained, on average, one Er ion per cluster. These clusters were then used as molecular seeds for the incorporation of individual Er³⁺ ions into Y₂O₃ nanocrystals. The resulting doped nanocrystals showed a stable and sharp photoluminescence in the 1.5–1.6 µm telecommunications wavelength range, and electron paramagnetic resonance spectroscopy confirmed the presence of Er³⁺ ions. Morphological and structural characterisation of the nanocrystals was performed using Transmission electron microscopy, X-ray diffraction and Raman spectroscopy. Sharp spectral features observed during Raman measurements and identified as Er³⁺ photoluminescence based on their strong agreement with the PL spectrum of Er-doped Y₂O₃. These results highlight the potential of molecular seeding approach for producing optically active rare-earth-doped nanocrystals and provide a basis for controlling the size of the nanocrystals towards the quantum-confinement regime.</p>" },
  "12:15": { speaker: "Peter Matthews", authors: "<span><b>Peter Matthews</b>, Keele University</span> <span>Ashleigh Cartlidge, Keele University</span> <span>Qasim Ibraheeme, Keele University</span> <span>Martin Hollamby, Keele University</span> <span>Lauren Matthews, ISIS Muon and Neutron Source</span>", html: "<p>Indium phosphide is the most studied of the colloidal III-V QDs, with significant attention focused on the phosphorus source and/or reaction conditions to improve QD quality. Comparatively limited attention has been directed toward controlling the reactivity of the indium precursor. In this study we introduce an approach that utilizes recyclable triarylphosphine adducts of indium(III) chloride to selectively prepare InP QDs with absorption profiles spanning 419-620 nm. This control is achieved through careful choice of the triarylphosphine ligand, which changes the nature of the nucleation profile from continuous to burst.</p><p>The performance of InP QDs is often hindered by unpredictable surface chemistry, most notably trap sites and dangling bonds which inhibit radiative recombination, and consequently, impedes the photoluminescent quantum yield (PLQY). Typically, in a bid to improve their emissive properties, various post-synthetic modification strategies, including shelling, ligand exchange and/or HF-based surface etching are implemented. In this paper, a novel approach is presented in which purified myristate-capped InP QDs are treated at room temperature with PCl3. Across a range of PCl3 treatments, it was determined through a combination of SANS/SAXS measurements that with increasing PCl3 addition, the troublesome organic shell is removed, enabling a more uniform adhesion of the ZnS shell to the inorganic core. As a result of this, the PLQY was observed to increase from 5% with no treatment, up to 70% with treatment, therefore establishing a HF-free alternative to surface passivation and improved emission.</p>" },
  "12:30": { speaker: "Charlotte Eling", authors: "<span>Nicolas Laurand, Institute of Photonics, Department of Physics, University of Strathclyde, Glasgow, UK</span> <span>Pedro U. Alves (Institute of Photonics, Department of Physics, University of Strathclyde, Glasgow, UK)</span> <span><b>Charlotte J. Eling</b> (Institute of Photonics, Department of Physics, University of Strathclyde, Glasgow, UK)</span>", html: "<p>Self-assembled supraparticles of colloidal quantum dots (CQDs) are an emerging photonic platform in which the gain medium and optical resonator are integrated within a single solution-processed structure. Dense packing of CQDs within microspherical supraparticles supports resonant modes, enabling compact microlasers without complex nanofabrication. Following a brief introduction to the operating principles of CQD-SP microlasers, this presentation will highlight three research directions pursued in our group.</p><p>First, we will discuss the integration of individual CQD supraparticle lasers with photonic circuitry through micro-transfer printing, enabling deterministic placement and coupling of self-assembled lasers to on-chip waveguides, an important step towards integrated colloidal photonics [1].</p><p>Second, we will present the functionalisation of supraparticles for optical sensing and biosensing applications [2,3]. Their optical confinement, accessible surface area, and wavelength-selective emission make them attractive platforms for chemical and biological sensing.</p><p>Finally, we will show how ligand exchange and multi-component CQD and nanocrystal blends can be used to engineer optical gain, energy-transfer pathways, and lasing characteristics, leading to reduced thresholds and new operating regimes, including multicolour and multiexcitonic lasing [4].</p><p>NL acknowledges the Leverhulme Trust for the Research Leadership Award RL 2019 038</p><ol><li>[1] P. U. Alves, et al. ACS Appl. Opt. Mater. 24; 1 (11): 1836–1846 (2023). https://doi.org/10.1021/acsaom.3c00312</li><li>[2] C. J. Eling, et al. ACS Appl. Nano Mater.; 7 (8): 9159–9166 (2024). https://doi.org/10.1021/acsanm.4c00668</li><li>[3] B. K. Charlton et al. International Journal of Molecular Sciences, 24(19), 14416 (2023). https://doi.org/10.3390/ijms241914416</li><li>[4] P. U. Alves, N. Laurand. ACS Photonics; 13 (3): 739–744 (2026). https://doi.org/10.1021/acsphotonics.5c02304</li></ol>" },
  "12:45": { speaker: "Sri Datta Aneesh Chodavarapu", authors: "<span><b>Sri Datta Aneesh Chodavarapu</b>, Cardiff University</span> <span>Chandra Kant,</span> <span class=\"nc\">Benxuan Li,</span> <span class=\"nc\">Bo Hou</span>", html: "<p>We report the first lithography-free, inkjet-printed electroluminescent colloidal quantum dot light-emitting diode (QLED) visible light communication (VLC) system. Colloidal quantum dots (QDs) offer spectrally tunable, narrowband emission with high colour purity and are fully compatible with low-cost, solution-processed fabrication, making them highly attractive for data communication applications. Owing to their high luminance, low turn-on voltage, narrow emission linewidths, and wide modulation bandwidths, QLEDs emerge as compelling candidates for real-time photonic wireless communication. Herein, a direct printing strategy was employed to fabricate the emissive QDs layer and electron injection layer, enabling precise device patterning on both flexible polymer substrates and conventional glass.</p><p>Compared to conventional spin-coating, inkjet printing significantly reduces material waste and offers compatibility with large-area, flexible, and pixelated device manufacturing. Key process parameters, including ink viscosity, surface tension, withdrawal speed, and solvent dispersibility, were systematically optimized to achieve uniform film thickness and morphology, ensuring efficient charge injection and stable device operation.</p><p>The fabricated devices exhibited &gt;80,000 cd m⁻², a current efficiency of 21.5 cd A⁻¹, external quantum efficiency (EQE) of 5%, and a low voltage of 2.5 V, narrow emission (FWHM ~21nm), and reliable signal transmission over a frequency range of 1 Hz to 50 kHz, with minor attenuation at higher frequencies due to emitter and receiver bandwidth limitations. To validate practical applicability, an Arduino-based optical communication system was developed. Text messages were encoded using pulse-width modulation, transmitted through the QLED, detected by a photodetector, and decoded in real time.</p><p>This work demonstrates the potential of inkjet-printed QLEDs as emitters for real-time audio and data transmission, highlighting their promise for scalable, low-cost, and flexible optical emitters and narrow linewidth optical interconnects.</p>" },
  "14:20": { speaker: "Anne-Sophie Korotov", authors: "<span><b>Anne-Sophie Korotov</b>, University of Oxford</span> <span>Eugenio Picheo, Gareth S. Jones, Jason M. Smith</span>", html: "<p>The nitrogen-vacancy (NV-) centre in diamond is a leading candidate for building scalable quantum networks due to its long spin-coherence times and readily available optical initialisation and readout. However, it suffers from low emission of coherent photons necessary to build entangled states. As a result, to date state-of-the-art quantum networks built upon NV- suffer from slow entanglement generation rates. [1], [2] To mitigate this, the NV- can be placed in an optical microcavity, resonant with its zero-phonon line (ZPL). This modifies the optical density of states and can enhance the efficiency of networked entanglement generation. Up to now, a common approach has been to use open-access microcavities, where two highly-reflective mirrors are placed above and below the emitter and tuned onto resonance by adjusting the cavity length with a piezoelectric actuator to one mirror. This configuration is unstable and difficult to scale. Here we present an alternative microcavity structure consisting of a planar-convex diamond microlens structure, onto which the mirrors can be directly deposited. We develop a scalable fabrication method using grayscale photolithography and inductively-coupled plasma reactive ion etching. This allows for the fabrication of large microlens arrays onto a single diamond membrane. Finally, we present progress towards coupling laser written deterministically fabricated NV- arrays to these monolithic cavity structures.</p><ol><li>[1] H. Bernien et al., “Heralded entanglement between solid-state qubits separated by three metres,” Nature, vol. 497, no. 7447, pp. 86–90, Apr. 2013, doi: 10.1038/nature12016.</li><li>[2] M. Pompili et al., “Experimental demonstration of entanglement delivery using a quantum network stack,” npj Quantum Information 2022 8:1, vol. 8, no. 1, pp. 121-, Oct. 2022, doi: 10.1038/s41534-022-00631-2.</li></ol>" },
  "14:35": { speaker: "Kieran Ramaswami", authors: "<span><b>Kieran Ramaswami</b>, University of Manchester</span> <span>Mihir Athavale, University of Manchester</span> <span>Jacob Wakley, Cardiff University</span> <span>Maddison Coke, University of Manchester</span> <span>Mason Adshead, University of Manchester</span> <span>Anthony Bennet, Cardiff University</span> <span>Richard Curry, University of Manchester</span> <span>Patrick Parkinson, University of Manchester</span>", html: "<p>Lead-vacancy (PbV) centres are promising for diamond quantum technologies. Their ~4 THz ground-state splitting, the largest among Group-IV colour centres, should allow spin coherence at higher temperatures than SiV, GeV or SnV. However, forming optically active PbVs has typically required high-pressure, high-temperature (HPHT) annealing. Here, we form PbVs in 100 nm nanodiamonds (nDs) by 30 keV Pb implantation followed by rapid thermal annealing at 1000 °C in argon. Using an automated micro-photoluminescence system, we characterised ~400 nDs across four implantation doses. Up to ~20% of implanted nDs show a PbV zero-phonon line at 552 nm, with &gt;4σ significance relative to an unimplanted reference. The PbV emission lifetime is 4.4 ± 0.1 ns. Several nDs show strongly polarised emission and a dependence on the polarisation of the excitation source. Continuous-wave and pulsed g(2) measurements confirm room-temperature antibunching, with g(2)(0) = 0.56 ± 0.03 without background subtraction. An initial study suggests that polarised emission correlates with non-classical behaviour (3 of 5 polarised vs 0 of 3 unpolarised nDs), offering a potential fast, low-cost pre-screen before time-consuming correlation measurements. Pb-implanted nDs therefore offer a scalable route to heavy Group-IV quantum emitters, compatible with pick-and-place integration into photonic structures.</p>" },
  "14:50": { speaker: "Maxim Makhonin", authors: "<span><b>Maxim Makhonin</b>, University of Sheffield</span> <span>Anatoliy Antill, University of Sheffield</span> <span>Agnethe Olsen, RobQuant Ltd</span> <span>Joe Smith, University of Sheffield</span>", html: "<p>NV centres in diamond are known to be one of the strongest candidates for small fields sensing applications. Their use in magnetoencephalograms for brain scans is currently limited by the need of applying high power green lasers (&gt;1W, which is too high for safe biological applications). Here we aim to significantly reduce the power needed for such technologies by creating an integrated device with embedded diamond enriched by NV centres for sensing in an optical cavity optimised for the pump laser.</p><p>Our cavity designed by TMM and numerical simulations in Tidy3D FDTD is made of planar DBRs of heterogeneously deposited layers of SiO2 / Si3Nx with a bespoke recipe [1] for PECVD deposition of low photoluminescence Si3Nx. By stacking two DBR mirrors we created an open cavity with a bottom mirror on a SiO2 substrate with 20 pairs DBR (high reflectivity &gt;99% in the green part of the spectrum) and varied the number of pairs on diamond samples for the top mirror. The small wedge in the diamond sample had to be corrected by rotating the sample to create an optimised cavity. Furthermore, to enhance the confinement of the pumping laser we fill the cavity with high refractive index optical material (oil/gel) and observe further improvement up to 13 times compared to bare diamond.</p><p>In achieving an order of magnitude improvement in optical efficiency, this work aims to build a scalable, CMOS-compatible low power solution for quantum sensing via NV centres.</p><ol><li>[1] J. Smith, et al., “Single photon emission and single spin coherence of a nitrogen vacancy center encapsulated in silicon nitride,” APL, v 116, 13, 2020, doi: https://doi.org/10.1063/5.0002709.</li></ol>" },
  "16:00": { speaker: "Savvas Germanis", authors: "<span><b>Savvas Germanis</b>, School of Mathematical and Physical Sciences, University of Sheffield, UK</span> <span>X. Chen, School of Mathematical and Physical Sciences, University of Sheffield, UK</span> <span>H. Siampour, School of Mathematics and Physics, Queen’s University Belfast, UK</span> <span>R. Dost, School of Mathematics and Physics, Queen’s University Belfast, UK</span> <span>N. J. Martin, School of Mathematical and Physical Sciences, University of Sheffield, UK</span> <span>D. J. Hallett, School of Mathematical and Physical Sciences, University of Sheffield, UK</span> <span>I. Farrer, EPSRC National Epitaxy Facility, University of Sheffield, UK</span> <span>A. K. Verma, EPSRC National Epitaxy Facility, University of Sheffield, UK</span> <span>M. S. Skolnick, School of Mathematics and Physics, Queen’s University Belfast, UK</span> <span>L. R. Wilson, School of Mathematics and Physics, Queen’s University Belfast, UK</span> <span>A. M. Fox, School of Mathematics and Physics, Queen’s University Belfast, UK</span>", html: "<p>Chiral light-matter interaction in nanophotonic waveguides enables spin-dependent directional emission from single quantum emitters [1]. Glide-plane photonic crystal waveguides support locally circularly polarised guided modes, giving rise to spin-momentum locking and asymmetric coupling of quantum dot excitons to counter-propagating modes [2].</p><p>We demonstrate electrical control of chiral emission from a single InAs quantum dot embedded in a slow-light glide-plane photonic crystal waveguide. The quantum dot is integrated in a p-i-n diode structure, allowing tuning of the exciton transition via the quantum-confined Stark effect. As the emission wavelength is swept across the slow-light bandwidth, the exciton lifetime is strongly modified and the directional emission contrast evolves markedly, exhibiting a clear sign inversion.</p><p>The reversible control of emission directionality from a single quantum emitter using an external electric field provides a practical route toward tuneable chiral interfaces in integrated quantum photonic devices and underscores the potential of slow-light glide-plane waveguides for scalable on-chip quantum technologies.</p><ol><li>[1] P. Lodahl, S. Mahmoodian, and S. Stobbe, Rev. Mod. Phys. 87, 347 (2015).</li><li>[2] S. Germanis, X. Chen, R. Dost, D. J. Hallett, E. Clarke, P. K. Patil, M. S. Skolnick, L. R. Wilson, H. Siampour and A. M. Fox, Optica 12, 1689 (2025).</li></ol>" },
  "16:15": { speaker: "Alfie Broughton", authors: "<span><b>Alfie Broughton</b>, Cardiff University</span> <span>Harry E. Dyte - Cardiff University</span> <span>Miguel Alvarez Perez - Cardiff University</span> <span>Micheal T. M. Woodley - Bath University</span> <span>Leah R. Murphy - Bath University</span> <span>Mateusz Olszewski - Bath University</span> <span>Alex O.C Davis - Bath University</span> <span>Anthony J. Bennett - Cardiff University</span>", html: "<p>Frequency combs have applications in many areas of research from sensing to time keeping. We present a method to create frequency combs in the single-photon regime using a single mode photonic crystal fibre (PCF) with a Ge-doped core. This fibre has been engineered for phase matching through a combination of normal and anomalous dispersion for the InAs quantum dot (QD) wavelength region (920 nm – 925 nm) and for the telecoms C-band. This allows for frequency conversion of photons from a 923nm quantum dot transition via Bragg-scattering four-wave mixing driven by two strong C-band pumps lasers, where a cascade of conversion events forms a comb with regularly spaced intervals. We demonstrate single-photon frequency combs with total conversion efficiencies &gt; 95%. Using a pair of unbalanced Mach-Zehnder interferometers we probe the relative phase of a generated qubit, which has undergone frequency conversion, through single-photon interference observing visibilities &gt; 0.9. A Hanbury-Brown Twiss setup confirms these are single-photon frequency combs under both resonant and non-resonant excitation of a QD. Comparing the frequency combs to the unconverted source signal demonstrates the process conserves both phase coherence and single-photon purity. These single-photon frequency combs can be used for quantum sensing as well as functioning as frequency bin qudits.</p>" },
}

const QDD_SECTION_NAV = [
  { href: '#programme', label: 'Programme' },
  { href: '#posters', label: 'Posters' },
  { href: '#venue', label: 'Venue' },
  { href: '#about', label: 'About' },
  { href: '#abstracts', label: 'Abstracts' },
  { href: '#committee', label: 'Committee' },
  { href: '#sponsors', label: 'Sponsors' }
]

const QDD_INVITED_URLS = Object.fromEntries(QDD_CONFIRMED_INVITEDS.map((speaker) => [speaker.name, speaker.url]))

const PAGE_META = {
  ...PUBLIC_PAGE_META,
  [QDD_REVIEW_PAGE_ID]: {
    title: 'Quantum Dot Day 2026 Committee Ranking',
    description: 'Choose contributed talks for Quantum Dot Day 2026.',
    robots: 'noindex,nofollow'
  }
}

const safeSpaUrl = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return ''
  if (value.includes('://') || value.includes('\\')) return ''
  return value
}

const decodeSpaSearch = (search = '') => {
  if (search[1] !== '/') return ''
  return search
    .slice(1)
    .split('&')
    .map((segment) => segment.replace(/~and~/g, '&'))
    .join('?')
}

/** Path to route, including a GitHub Pages ?/ redirect the history rewrite has not applied yet. */
const resolveSpaPathname = () => {
  if (typeof window === 'undefined') return '/'
  const hinted = safeSpaUrl(window.__sqilSpaPath)
  if (window.__sqilSpaPath) delete window.__sqilSpaPath
  const fromQuery = safeSpaUrl(decodeSpaSearch(window.location.search))
  const nextUrl = hinted || fromQuery
  if (!nextUrl) return window.location.pathname
  const pathname = nextUrl.split(/[?#]/)[0] || '/'
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
    window.history.replaceState(null, '', nextUrl)
  }
  return pathname
}

const pageIdForPathname = (pathname = '/') => {
  const normalized = normalizePathname(pathname)
  // Unlisted committee page. Do not add this path to nav, footer, sitemap, or robots.txt.
  if (normalized === QDD_REVIEW_PATH) return QDD_REVIEW_PAGE_ID
  return pageIdForPublicPath(normalized) || NOT_FOUND_PAGE_ID
}

const pathForPageId = (pageId = 'home') => {
  if (pageId === QDD_REVIEW_PAGE_ID) return QDD_REVIEW_PATH
  return ALL_ROUTES.find((link) => link.id === pageId)?.path || '/'
}

const setHeadTag = (selector, create, attribute, value) => {
  let tag = document.head.querySelector(selector)
  if (value == null) {
    tag?.remove()
    return
  }
  if (!tag) {
    tag = create()
    document.head.appendChild(tag)
  }
  tag.setAttribute(attribute, value)
}

const setMetaName = (name, content) =>
  setHeadTag(`meta[name="${name}"]`, () => Object.assign(document.createElement('meta'), { name }), 'content', content)

const setMetaProperty = (property, content) =>
  setHeadTag(
    `meta[property="${property}"]`,
    () => {
      const tag = document.createElement('meta')
      tag.setAttribute('property', property)
      return tag
    },
    'content',
    content
  )

const setCanonical = (href) =>
  setHeadTag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', href)

const applyPageMeta = (pageId) => {
  const meta = resolvePageMeta(pageId, PAGE_META)
  document.title = meta.title
  setMetaName('description', meta.description)
  setMetaName('robots', meta.robots)
  setMetaName('twitter:title', meta.title)
  setMetaName('twitter:description', meta.description)
  setMetaName('twitter:image', meta.image.url)
  setMetaProperty('og:title', meta.title)
  setMetaProperty('og:description', meta.description)
  setMetaProperty('og:url', meta.url)
  setMetaProperty('og:image', meta.image.url)
  setMetaProperty('og:image:width', String(meta.image.width))
  setMetaProperty('og:image:height', String(meta.image.height))
  setMetaProperty('og:image:alt', meta.image.alt)
  setCanonical(meta.url)
}

const scrollToHash = (hash) => {
  if (!hash || hash === '#') return false
  let id = hash.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {
    // keep the raw fragment
  }
  const target = document.getElementById(id)
  if (!target) return false
  target.scrollIntoView({ block: 'start' })
  return true
}

const isPlainLeftClick = (event) =>
  event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey

// ---- Quantum Dot Day 2026: styled programme + posters (styled variant) ----
const QDD_EVENT_START_MS = Date.UTC(2026, 10, 26, 9, 0, 0) // 26 Nov 2026 09:00 UK (GMT)
const QDD_EVENT_END_MS = Date.UTC(2026, 10, 26, 17, 0, 0)

// Full class strings so Tailwind keeps them. One accent per session theme.
const QDD_THEME_STYLE = {
  'Epitaxy / III–V emitters': {
    text: 'text-cyan-300', border: 'border-cyan-400/40', bar: 'bg-cyan-400', soft: 'bg-cyan-400/10',
    ring: 'hover:border-cyan-300/70', glow: 'rgba(34,211,238,0.30)', badge: 'bg-cyan-400 text-[#0B1629]'
  },
  'Colloidal / soft-matter': {
    text: 'text-fuchsia-300', border: 'border-fuchsia-400/40', bar: 'bg-fuchsia-400', soft: 'bg-fuchsia-400/10',
    ring: 'hover:border-fuchsia-300/70', glow: 'rgba(232,121,249,0.28)', badge: 'bg-fuchsia-400 text-[#0B1629]'
  },
  'Colour centres / defects': {
    text: 'text-emerald-300', border: 'border-emerald-400/40', bar: 'bg-emerald-400', soft: 'bg-emerald-400/10',
    ring: 'hover:border-emerald-300/70', glow: 'rgba(52,211,153,0.28)', badge: 'bg-emerald-400 text-[#0B1629]'
  },
  'Optics / integration / devices': {
    text: 'text-amber-300', border: 'border-amber-400/40', bar: 'bg-amber-400', soft: 'bg-amber-400/10',
    ring: 'hover:border-amber-300/70', glow: 'rgba(251,191,36,0.26)', badge: 'bg-amber-400 text-[#0B1629]'
  }
}
const qddThemeStyle = (theme) => QDD_THEME_STYLE[theme] || QDD_THEME_STYLE['Epitaxy / III–V emitters']

const QDD_PROGRAMME_SESSIONS = QDD_PROGRAMME.filter((item) => item.type === 'session')
const QDD_SPEAKER_COUNT = QDD_PROGRAMME_SESSIONS.reduce((n, s) => n + s.talks.length, 0)
const QDD_INVITED_COUNT = QDD_PROGRAMME_SESSIONS.reduce(
  (n, s) => n + s.talks.filter((t) => t.invited).length,
  0
)
const QDD_INSTITUTION_COUNT = new Set([
  ...QDD_PROGRAMME_SESSIONS.flatMap((s) => s.talks.map((t) => t.institution)),
  ...QDD_POSTERS.map((p) => p.institution)
]).size
const qddSessionId = (numeral) => `session-${numeral.toLowerCase()}`
const QddAbstract = ({ time }) => {
  const abstract = QDD_TALK_ABSTRACTS[time]
  if (!abstract) return null
  return (
    <details className="group mt-2">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80 transition-colors hover:text-cyan-200 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">›</span>
        <span className="group-open:hidden">Abstract</span>
        <span className="hidden group-open:inline">Hide abstract</span>
      </summary>
      <div className="mt-3 max-w-3xl border-l border-white/10 pl-4 text-sm leading-relaxed text-white/70">
        {abstract.authors ? (
          <p
            className="mb-3 text-xs leading-relaxed text-white/50 [&>span+span:not(.nc)]:before:mx-1.5 [&>span+span:not(.nc)]:before:text-cyan-400/70 [&>span+span:not(.nc)]:before:content-['·'] [&_b]:font-semibold [&_b]:text-white/80 [&_sup]:text-[0.7em]"
            dangerouslySetInnerHTML={{ __html: abstract.authors }}
          />
        ) : null}
        <div
          className="space-y-3 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol]:text-xs [&_ol]:text-white/50 [&_sup]:text-[0.7em]"
          dangerouslySetInnerHTML={{ __html: abstract.html }}
        />
      </div>
    </details>
  )
}

const qddTalkTitle = (title) => (title && title !== 'Title to be confirmed' ? title : '')
// One inset for the header, hero, and programme so those blocks share a left edge.
const QDD_FRAME = 'mx-auto w-full max-w-6xl px-6 sm:px-8'
const QDD_MEASURE = 'max-w-xl lg:max-w-2xl'

// Soft glowing points of light behind a section. Static when the user prefers reduced motion.
const QDD_GLOW_POINTS = [
  { x: '8%', y: '6%', s: 220, d: '7s' }, { x: '78%', y: '14%', s: 260, d: '9s' },
  { x: '30%', y: '38%', s: 180, d: '8s' }, { x: '88%', y: '52%', s: 240, d: '10s' },
  { x: '4%', y: '70%', s: 260, d: '9s' }, { x: '60%', y: '84%', s: 200, d: '7.5s' }
]
const QddGlowField = ({ themes }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    {QDD_GLOW_POINTS.map((point, index) => (
      <span
        key={index}
        className="absolute rounded-full blur-2xl motion-safe:animate-pulse"
        style={{
          left: point.x,
          top: point.y,
          width: point.s,
          height: point.s,
          background: `radial-gradient(circle, ${qddThemeStyle(themes[index % themes.length]).glow} 0%, transparent 70%)`,
          animationDuration: point.d,
          animationDelay: `${index * 0.7}s`
        }}
      />
    ))}
  </div>
)

const qddCountdownParts = (now) => {
  const ms = Math.max(QDD_EVENT_START_MS - now, 0)
  const minutes = Math.floor(ms / 60_000)
  return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60, done: ms === 0 }
}

const QddCountdown = () => {
  const now = useNow(QDD_EVENT_START_MS, 30_000)
  const { days, hours, minutes, done } = qddCountdownParts(now)
  if (done) {
    if (now > QDD_EVENT_END_MS) return null
    return <p className="text-sm font-semibold text-cyan-200">Quantum Dot Day is under way. Welcome!</p>
  }
  const cells = [
    { value: days, label: days === 1 ? 'day' : 'days' },
    { value: hours, label: hours === 1 ? 'hour' : 'hours' },
    { value: minutes, label: minutes === 1 ? 'min' : 'mins' }
  ]
  return (
    <div aria-label={`${days} days, ${hours} hours and ${minutes} minutes until Quantum Dot Day`} role="timer">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Starts in</p>
      <div className="flex gap-2" aria-hidden="true">
        {cells.map((cell) => (
          <div key={cell.label} className="min-w-0 flex-1 rounded-sm border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center">
            <span className="block text-xl font-semibold tabular-nums text-white">{cell.value}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">{cell.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const QddJumpLinks = ({ compact = false }) => (
  <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
    {QDD_PROGRAMME_SESSIONS.map((session) => {
      const style = qddThemeStyle(session.title)
      return (
        <li key={session.numeral} className="shrink-0">
          <a
            href={`#${qddSessionId(session.numeral)}`}
            className={`inline-flex items-center gap-2 rounded-full border ${style.border} ${style.soft} px-3 py-1.5 text-xs font-semibold text-white/85 transition-colors hover:text-white`}
          >
            <span className={`h-2 w-2 rounded-full ${style.bar}`} aria-hidden="true" />
            <span className="tabular-nums text-white/55">{session.time}</span>
            <span>{compact ? `Session ${session.numeral}` : `${session.numeral} · ${session.title}`}</span>
          </a>
        </li>
      )
    })}
    <li className="shrink-0">
      <a
        href="#posters"
        className="inline-flex items-center rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:text-white"
      >
        Posters
      </a>
    </li>
  </ul>
)

const QddProgrammeStyled = () => {
  const inlineBarRef = useRef(null)
  const sectionRef = useRef(null)
  const [showFixedBar, setShowFixedBar] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    let barAbove = false
    let sectionVisible = false
    const update = () => setShowFixedBar(barAbove && sectionVisible)
    const barObserver = new IntersectionObserver(([entry]) => {
      barAbove = !entry.isIntersecting && entry.boundingClientRect.top < 0
      update()
    })
    const sectionObserver = new IntersectionObserver(([entry]) => {
      sectionVisible = entry.isIntersecting
      update()
    }, { rootMargin: '-64px 0px -40% 0px' })
    if (inlineBarRef.current) barObserver.observe(inlineBarRef.current)
    if (sectionRef.current) sectionObserver.observe(sectionRef.current)
    return () => {
      barObserver.disconnect()
      sectionObserver.disconnect()
    }
  }, [])

  return (
    <section id="programme" ref={sectionRef} className="relative scroll-mt-6 overflow-hidden border-t border-white/10">
      <QddGlowField themes={QDD_SESSIONS} />

      {/* Opens on the same inset and a quieter scale than the hero title. */}
      <div className="relative border-b border-white/10">
        <div className={`${QDD_FRAME} grid gap-0 py-8 md:grid-cols-[minmax(0,1fr)_19.5rem] md:py-10 lg:grid-cols-[minmax(0,1fr)_23rem] xl:grid-cols-[minmax(0,40rem)_24rem] xl:justify-between`}>
          <div className="flex max-w-xl flex-col md:max-w-none md:pr-10 lg:pr-16">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">Programme</p>
              <h2 className="text-[1.5rem] font-bold leading-[1.15] tracking-tight text-white sm:text-[1.7rem] lg:text-[1.85rem]">
                <span className="block">One day. Four sessions.</span>
                <span className="mt-1 block text-cyan-300">Quantum dots and beyond.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60 md:text-[15px]">
                Invited talks 30 minutes, contributed talks 15 minutes. Posters are up all day.
              </p>
            </div>
            <div className="hidden min-h-8 flex-1 md:block" aria-hidden="true" />
            <dl className="mt-6 grid max-w-md grid-cols-3 gap-x-4 border-t border-white/10 pt-4">
              {[
                { value: QDD_SPEAKER_COUNT, label: 'Speakers', note: `${QDD_INVITED_COUNT} invited` },
                { value: QDD_POSTERS.length, label: 'Posters', note: 'all day' },
                { value: QDD_INSTITUTION_COUNT, label: 'Institutions', note: 'UK and Europe' }
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{stat.label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-white">{stat.value}</dd>
                  <dd className="text-[11px] text-white/40">{stat.note}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 md:mt-0 md:border-l md:border-t-0 md:pl-8 md:pt-0 lg:pl-10">
            <QddCountdown />
            <p className="mt-4 text-sm font-semibold text-white">Registration is closed.</p>
            <a
              href={QDD_EXHIBITOR_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-sm border border-white/20 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-cyan-300 hover:text-cyan-200"
            >
              Exhibitors and sponsors
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              <span className="inline-block">
                Table-top stand <strong className="font-semibold text-white">£300</strong>
              </span>
              <span className="text-white/30"> · </span>
              <span className="inline-block">
                logo only <strong className="font-semibold text-white">£240</strong>
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Jump bar: inline, plus a fixed copy while the programme is on screen */}
      <nav aria-label="Jump to session" ref={inlineBarRef} className="relative border-b border-white/10 bg-[#0B1629]/85 py-3 backdrop-blur">
        <div className={`${QDD_FRAME} flex items-center gap-3`}>
          <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:inline">Jump to session</span>
          <QddJumpLinks />
        </div>
      </nav>
      {showFixedBar ? (
        <nav aria-label="Jump to session (pinned)" className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0B1629]/90 py-2.5 shadow-lg backdrop-blur">
          <div className={`${QDD_FRAME} flex items-center gap-3`}>
            <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:inline">Jump to</span>
            <QddJumpLinks compact />
          </div>
        </nav>
      ) : null}

      {/* Timeline */}
      <div className={`${QDD_FRAME} relative py-12 md:py-16`}>
        <ol className="relative space-y-5 md:pl-28">
          <span className="absolute bottom-2 left-[5.25rem] top-2 hidden w-px bg-gradient-to-b from-cyan-400/50 via-fuchsia-400/40 to-amber-400/50 md:block" aria-hidden="true" />
          {QDD_PROGRAMME.map((item) => {
            if (item.type === 'break') {
              return (
                <li key={item.time} className="relative flex items-center gap-4 py-1 text-sm text-white/55">
                  <span className="w-24 shrink-0 tabular-nums text-white/45 md:absolute md:-left-28 md:w-20 md:text-right">
                    {item.time}
                  </span>
                  <span className="absolute -left-[1.6rem] hidden h-2 w-2 rounded-full bg-white/30 md:block" aria-hidden="true" />
                  <span className="flex-1 border-t border-dashed border-white/15 pt-1 md:border-0 md:pt-0">
                    {item.title} <span className="text-white/35">· until {item.end}</span>
                  </span>
                </li>
              )
            }
            const style = qddThemeStyle(item.title)
            const [invited, ...contributed] = item.talks
            return (
              <li key={item.time} id={qddSessionId(item.numeral)} className="relative scroll-mt-20">
                <span className="hidden tabular-nums md:absolute md:-left-28 md:top-6 md:block md:w-20 md:text-right md:text-sm md:font-semibold md:text-white/70">
                  {item.time}
                </span>
                <span className={`absolute -left-[1.9rem] top-7 hidden h-3.5 w-3.5 rounded-full ring-4 ring-[#0B1629] md:block ${style.bar}`} aria-hidden="true" />
                <article className={`relative overflow-hidden rounded-sm border ${style.border} bg-[#0E1B32]/90 transition-colors ${style.ring}`}>
                  <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} aria-hidden="true" />
                  <header className={`flex items-start gap-4 border-b border-white/10 ${style.soft} px-5 py-5 md:px-7`}>
                    <span className={`text-6xl font-extrabold leading-none tracking-tight md:text-7xl ${style.text}`} aria-hidden="true">
                      {item.numeral}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${style.text}`}>
                        Session {item.numeral} · {item.time}–{item.end}
                      </p>
                      <h3 className="mt-1 text-xl font-bold tracking-tight text-white md:text-2xl">{item.title}</h3>
                      <p className="mt-1 text-sm text-white/55">Chair: {item.chair}</p>
                    </div>
                  </header>
                  <div className="px-5 py-5 md:px-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-5">
                      <span className="w-14 shrink-0 pt-1 text-sm font-semibold tabular-nums text-white/70">{invited.time}</span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {QDD_INVITED_URLS[invited.speaker] ? (
                            <a
                              href={QDD_INVITED_URLS[invited.speaker]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-bold text-white underline-offset-4 transition-colors hover:text-cyan-300 hover:underline md:text-xl"
                            >
                              {invited.speaker}
                            </a>
                          ) : (
                            <span className="text-lg font-bold text-white md:text-xl">{invited.speaker}</span>
                          )}
                          {invited.invited ? (
                            <span className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${style.badge}`}>
                              Invited
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-white/55">{invited.institution}</p>
                        {qddTalkTitle(invited.title) ? (
                          <p className="mt-1 text-base text-white/85 md:text-lg">{qddTalkTitle(invited.title)}</p>
                        ) : null}
                        <QddAbstract time={invited.time} />
                      </div>
                    </div>
                    {contributed.length ? (
                      <ul className="mt-5 space-y-3 border-t border-white/10 pt-4">
                        {contributed.map((talk) => (
                          <li key={talk.time} className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-5">
                            <span className="w-14 shrink-0 tabular-nums text-white/45">{talk.time}</span>
                            <span className="min-w-0">
                              <span className="font-semibold text-white/90">{talk.speaker}</span>
                              <span className="text-white/45"> — {talk.institution}</span>
                              {qddTalkTitle(talk.title) ? (
                                <span className="block text-white/65">{qddTalkTitle(talk.title)}</span>
                              ) : null}
                              <QddAbstract time={talk.time} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

const QddPostersStyled = () => (
  <section id="posters" className="relative scroll-mt-6 overflow-hidden border-t border-white/10 py-14 md:py-16">
    <QddGlowField themes={[...QDD_SESSIONS].reverse()} />
    <div className={`relative ${QDD_FRAME}`}>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Posters <span className="text-white/40">({QDD_POSTERS.length})</span>
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
            On display all day in the conference room.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-sm border border-amber-400/40 bg-amber-400/10 px-4 py-3">
          <Trophy className="h-6 w-6 shrink-0 text-amber-300" aria-hidden="true" />
          <p className="text-sm text-white/80">
            <strong className="block font-bold text-amber-200">Poster prizes at 16:30</strong>
            Announced in the closing remarks.
          </p>
        </div>
      </div>
      {QDD_SESSIONS.map((theme) => {
        const items = QDD_POSTERS.filter((poster) => poster.theme === theme)
        if (items.length === 0) return null
        const style = qddThemeStyle(theme)
        return (
          <div key={theme} className="mb-10 last:mb-0">
            <h3 className={`mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.text}`}>
              <span className={`h-2 w-2 rounded-full ${style.bar}`} aria-hidden="true" />
              {theme}
              <span className="text-white/35">· {items.length}</span>
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((poster) => (
                <li
                  key={poster.speaker}
                  className={`relative flex flex-col overflow-hidden rounded-sm border border-white/10 bg-[#0E1B32]/90 p-4 transition-colors ${style.ring}`}
                >
                  <span className={`absolute inset-x-0 top-0 h-0.5 ${style.bar}`} aria-hidden="true" />
                  <p className="text-sm leading-snug text-white/85">{poster.title}</p>
                  <p className="mt-auto pt-3 text-xs">
                    <span className="font-semibold text-white">{poster.speaker}</span>
                    <span className="text-white/45"> — {poster.institution}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  </section>
)

const QuantumDotDayView = ({ getPathForPage, onInternalLinkClick }) => (
  <div className="qdd-page min-h-screen bg-[#0B1629] text-white selection:bg-cyan-400/30 selection:text-white">
    <header className="border-b border-white/5">
      <div className={`${QDD_FRAME} flex items-center justify-between py-4`}>
        <a
          href={getPathForPage('home')}
          onClick={(event) => onInternalLinkClick(event, 'home')}
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35 transition-colors hover:text-cyan-300"
        >
          SQIL
        </a>
        <nav aria-label="On this page" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {QDD_SECTION_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-cyan-300"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>

    <section className="relative overflow-hidden">
      <img
        src="/assets/quantum-dot-day.jpg"
        alt="Quantum Dot Day — Sheffield Town Hall with a quantum network overlay"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[68%_center] qdd-hero-image"
        width={2050}
        height={890}
        decoding="async"
        fetchPriority="high"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B1629] from-[12%] via-[#0B1629]/90 via-[58%] to-[#0B1629]/20"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#0B1629]/50 lg:bg-transparent" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B1629] to-transparent"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 qdd-atmosphere" aria-hidden="true" />
      <div className={`relative ${QDD_FRAME}`}>
        <div className={`flex flex-col justify-center py-12 qdd-hero-copy sm:py-14 lg:py-16 ${QDD_MEASURE}`}>
          <div className="mb-6 flex flex-wrap items-end gap-x-5 gap-y-2">
            <p className="text-[7.5rem] font-extrabold leading-none tracking-tight text-cyan-400 md:text-[9rem]">
              26
            </p>
            <div className="pb-3">
              <p className="text-2xl font-bold uppercase tracking-[0.18em] text-white md:text-3xl">
                November
              </p>
              <p className="mt-1 text-sm font-medium text-white/50">Thursday · 2026</p>
            </div>
          </div>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Quantum Dot Day
          </h1>
          <p className="mb-6 max-w-md text-base font-light leading-relaxed text-white/70 md:text-lg">
            One-day UK meeting on quantum dots and solid-state emitters. Sheffield Town Hall.
          </p>
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
              Invited speakers
            </p>
            <ul className="space-y-1.5">
              {QDD_CONFIRMED_INVITEDS.map((speaker) => (
                <li key={speaker.name} className="text-base text-white/80 md:text-lg">
                  <a
                    href={speaker.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
                  >
                    {speaker.name}
                  </a>
                  <span className="text-white/45"> — {speaker.institution}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-start gap-3 text-white/80">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
            <p className="text-base">Sheffield Town Hall, Pinstone Street, Sheffield</p>
          </div>
        </div>
      </div>
    </section>

    <QddProgrammeStyled />

    <QddPostersStyled />

    <section id="about" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
          About the series
        </h2>
        <div className="space-y-5 text-sm leading-relaxed text-white/60 md:text-base">
          <p>
            Quantum Dot Day brings together researchers working on quantum optics, spectroscopy,
            spin physics, transport, devices and applications, synthesis and growth of semiconductor
            quantum dots, and defect-centre quantum emitters in diamond, silicon carbide,
            III-nitrides and other materials.
          </p>
          <p>
            The 2026 meeting, hosted by the University of Sheffield, keeps the broader scope of
            Cardiff 2025 — colour centres and related emitters as well as epitaxial dots — with four
            invited talks plus contributed talks and posters.
          </p>
          <p>
            This is the latest in a series of one-day workshops previously held in Bristol,
            Lancaster, Sheffield, Edinburgh, Cambridge, Imperial College, Nottingham, Manchester,
            University College London, and Cardiff.
          </p>
          <p>
            Generously supported by the{' '}
            <a
              href={QDD_IOP_OPTICAL_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              IOP Optical Group
            </a>{' '}
            and the{' '}
            <a
              href={QDD_IOP_QEP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              IOP Quantum, Electronics and Photonics Group
            </a>
            .
          </p>
        </div>
      </div>
    </section>

    <section id="abstracts" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
          Contributed talks and posters
        </h2>
        <p className="text-sm leading-relaxed text-white/60 md:text-base">
          Abstracts for contributed talks and posters closed on{' '}
          <strong className="font-semibold text-white">Thursday 8 October 2026</strong>. Registration
          is closed.
        </p>
      </div>
    </section>

    <section id="register" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
          Registration
        </h2>
        <p className="text-sm leading-relaxed text-white/60 md:text-base">
          Registration is closed.
        </p>
      </div>
    </section>

    <section id="committee" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
          Organising committee
        </h2>
        <p className="mb-6 border-l-2 border-cyan-400/70 pl-4 text-sm text-white/80 md:text-base">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
            Chair / local host
          </span>
          <span className="mt-1 block font-medium text-white">Joe A. Smith</span>
          <span className="text-white/50">University of Sheffield</span>
        </p>
        <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {QDD_COMMITTEE.map((member) => (
            <li key={member.name}>
              <p className="text-sm font-medium text-white md:text-base">{member.name}</p>
              <p className="text-sm text-white/45">{member.institution}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section id="sponsors" aria-labelledby="qdd-sponsors" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 id="qdd-sponsors" className="mb-3 text-xl font-bold tracking-tight text-white md:text-2xl">
          Sponsors
        </h2>
        <p className="mb-5 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
          Sponsorship packages are open.
        </p>
        <a
          href={QDD_EXHIBITOR_SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 inline-flex items-center justify-center gap-2 rounded-sm border border-cyan-400/70 px-6 py-3 text-sm font-bold uppercase tracking-wider text-cyan-200 transition-all duration-300 hover:border-cyan-300 hover:text-white"
        >
          Exhibitors and sponsors
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
        <ul className="flex flex-wrap items-center gap-4">
          <li>
            <a
              href={QDD_PI_KEM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PI-KEM"
              className="flex h-28 items-center justify-center bg-white px-6"
            >
              <img src="/assets/pi-kem-logo.jpg" alt="PI-KEM" className="h-20 w-20 object-contain" />
            </a>
          </li>
          <li>
            <a
              href={QDD_AEGIQ_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Aegiq"
              className="flex h-28 items-center justify-center bg-white px-8"
            >
              <img src="/assets/aegiq-logo.svg" alt="Aegiq" className="h-12 w-auto" />
            </a>
          </li>
          <li>
            <a
              href={QDD_QUANTUM_DESIGN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Quantum Design UK and Ireland"
              className="flex h-28 items-center justify-center bg-white px-6"
            >
              <img
                src="/assets/quantum-design-logo.jpg"
                alt="Quantum Design"
                className="h-16 w-auto object-contain"
              />
            </a>
          </li>
          <li>
            <a
              href={QDD_OXFORD_INSTRUMENTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Oxford Instruments"
              className="flex h-28 items-center justify-center bg-white px-5"
            >
              <img
                src="/assets/oxford-instruments-logo.jpg"
                alt="Oxford Instruments"
                className="h-16 w-auto object-contain sm:h-20"
              />
            </a>
          </li>
          <li>
            <a
              href={QDD_ROBQUANT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="RobQuant"
              className="flex h-28 items-center justify-center gap-3 bg-white px-6"
            >
              <img src="/assets/robquant-mark.svg" alt="" className="h-12 w-12" />
              <span className="text-xl font-bold tracking-tighter text-[#070B1F]">ROBQUANT</span>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <section id="venue" aria-labelledby="qdd-venue" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h2 id="qdd-venue" className="text-xl font-bold tracking-tight text-white md:text-2xl">
          Venue and how to find us
        </h2>
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-white/70 md:text-base">
            Sheffield Town Hall, Pinstone Street, Sheffield S1 2HH. Please come in through the{' '}
            <span className="font-semibold text-white">main entrance on Pinstone Street</span>. We are in{' '}
            <span className="font-semibold text-white">Reception Rooms A and B</span>. Registration and coffee from
            09:00; the programme begins with a short welcome at 09:30.
          </p>
        </div>
        <ul className="space-y-2 pl-8 text-sm leading-relaxed text-white/70 md:text-base">
          <li>
            <span className="font-semibold text-white">From Sheffield station:</span> about 10 minutes on foot (700 m),
            up Howard Street and past the Peace Gardens.
          </li>
          <li>
            <span className="font-semibold text-white">By tram:</span> Cathedral or City Hall stops, about 5 minutes&apos;
            walk.
          </li>
          <li>
            <span className="font-semibold text-white">By car:</span> Q-Park Charles Street, St Paul&apos;s Place, Sheffield
            S1 2NA, about 3 minutes&apos; walk.
          </li>
        </ul>
        <figure className="overflow-hidden rounded-lg border border-white/10">
          <a href="/assets/qdd-how-to-find-us-2x.jpg" target="_blank" rel="noopener noreferrer">
            <img
              src="/assets/qdd-how-to-find-us.jpg"
              srcSet="/assets/qdd-how-to-find-us.jpg 1200w, /assets/qdd-how-to-find-us-2x.jpg 2400w"
              sizes="(min-width: 768px) 768px, 100vw"
              alt="Map of Sheffield city centre showing walking routes to the main entrance of Sheffield Town Hall on Pinstone Street from Sheffield station and from Q-Park Charles Street, with the Cathedral and City Hall tram stops"
              width={1200}
              height={1532}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </a>
          <figcaption className="px-4 py-2 text-xs text-white/45">Map data © OpenStreetMap contributors.</figcaption>
        </figure>
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-white/70 md:text-base">
            Joe A. Smith,{' '}
            <a
              href="mailto:joe.a.smith@sheffield.ac.uk"
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              joe.a.smith@sheffield.ac.uk
            </a>
          </p>
        </div>
      </div>
    </section>

    <footer className="border-t border-white/10 bg-[#08101f] py-7">
      <div className={`${QDD_FRAME} flex flex-col items-start justify-between gap-3 text-xs text-white/40 sm:flex-row sm:items-center`}>
        <p>
          University of Sheffield
          <span className="mx-2 text-white/20">·</span>
          <a
            href={getPathForPage('home')}
            onClick={(event) => onInternalLinkClick(event, 'home')}
            className="text-white/50 transition-colors hover:text-cyan-300"
          >
            SQIL
          </a>
        </p>
        <p className="text-white/30">Quantum Dot Day · 26 November 2026</p>
      </div>
    </footer>

    <style>{`
      html {
        scroll-behavior: smooth;
      }
      .qdd-atmosphere {
        background:
          radial-gradient(ellipse 50% 40% at 15% 30%, rgba(34, 211, 238, 0.08), transparent 60%),
          radial-gradient(ellipse 40% 35% at 85% 70%, rgba(34, 211, 238, 0.05), transparent 55%);
      }
      .qdd-hero-image {
        animation: qddKenBurns 22s ease-out forwards;
      }
      .qdd-hero-copy {
        animation: qddRise 0.85s ease-out both;
      }
      @keyframes qddKenBurns {
        from { transform: scale(1.02); }
        to { transform: scale(1); }
      }
      @keyframes qddRise {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .qdd-hero-image,
        .qdd-hero-copy {
          animation: none;
        }
      }
    `}</style>
  </div>
)

export default function App() {
  const [route, setRoute] = useState(() => ({
    pageId: typeof window === 'undefined' ? 'home' : pageIdForPathname(resolveSpaPathname()),
    hash: typeof window === 'undefined' ? '' : window.location.hash,
    key: 0,
    source: 'load'
  }))
  const activePage = route.pageId
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [content, setContent] = useState(fallbackContent)
  const mainRef = useRef(null)

  const navigateTo = (pageId, hash = '') => {
    const nextPageId = ALL_ROUTES.some((link) => link.id === pageId) ? pageId : 'home'
    const nextUrl = `${pathForPageId(nextPageId)}${hash}`

    if (typeof window !== 'undefined') {
      const currentUrl = `${normalizePathname(window.location.pathname)}${window.location.search}${window.location.hash}`
      if (currentUrl !== nextUrl) {
        window.history.pushState({}, '', nextUrl)
      }
    }

    setRoute((prev) => ({ pageId: nextPageId, hash, key: prev.key + 1, source: 'push' }))
    setMobileMenuOpen(false)
  }

  const onInternalLinkClick = (event, pageId, hash = '') => {
    if (!isPlainLeftClick(event)) return
    event.preventDefault()
    navigateTo(pageId, hash)
  }

  useEffect(() => {
    const syncRouteFromLocation = () => {
      const nextPageId = pageIdForPathname(resolveSpaPathname())

      // Unknown paths keep their URL so the not-found view describes what was requested.
      if (nextPageId !== NOT_FOUND_PAGE_ID) {
        const normalizedPath = pathForPageId(nextPageId)
        if (window.location.pathname !== normalizedPath) {
          window.history.replaceState({}, '', `${normalizedPath}${window.location.search}${window.location.hash}`)
        }
      }

      setRoute((prev) => ({ pageId: nextPageId, hash: window.location.hash, key: prev.key + 1, source: 'pop' }))
      setMobileMenuOpen(false)
    }

    syncRouteFromLocation()
    window.addEventListener('popstate', syncRouteFromLocation)
    return () => window.removeEventListener('popstate', syncRouteFromLocation)
  }, [])

  useEffect(() => {
    if (!scrollToHash(route.hash)) window.scrollTo(0, 0)
    if (route.source === 'push') mainRef.current?.focus({ preventScroll: true })
  }, [route.key])

  useEffect(() => {
    let cancelled = false
    const loadContent = async () => {
      try {
        const response = await fetch(`/data/site-content.json?v=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        if (!response.ok) throw new Error('Failed to load content JSON')
        const data = await response.json()
        if (!cancelled) {
          setContent(data)
        }
      } catch (error) {
        console.error('Falling back to bundled content:', error)
        if (!cancelled) {
          setContent(fallbackContent)
        }
      }
    }

    loadContent()
    return () => {
      cancelled = true
    }
  }, [])

  const opportunities = content.opportunitiesPage
  const now = useNow(nextRecruitmentChange(opportunities, Date.now()))
  const recruitment = getRecruitmentState(opportunities, now)
  const getPathForPage = (pageId) => pathForPageId(pageId)
  const nav = useMemo(() => ({ pathFor: pathForPageId, onLinkClick: onInternalLinkClick }), [])

  useLayoutEffect(() => {
    applyPageMeta(activePage)
  }, [activePage])

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomeView content={content} recruitment={recruitment} />
      case 'research':
        return <ResearchView research={content.researchPage} recruitment={recruitment} />
      case 'people':
        return <PeopleView people={content.peoplePage} />
      case 'publications':
        return <PublicationsView />
      case 'facilities':
        return <FacilitiesView facilities={content.facilitiesPage} />
      case 'news':
        return <NewsView />
      case 'opportunities':
        return <OpportunitiesView opportunities={opportunities} contact={content.contactPage} recruitment={recruitment} />
      case 'contact':
        return <ContactView contact={content.contactPage} />
      case 'quantum-dot-day':
        return (
          <QuantumDotDayView
            getPathForPage={getPathForPage}
            onInternalLinkClick={onInternalLinkClick}
          />
        )
      case QDD_REVIEW_PAGE_ID:
        return <QddReviewPage />
      default:
        return <NotFoundView />
    }
  }

  const isEventMicrosite = activePage === 'quantum-dot-day' || activePage === QDD_REVIEW_PAGE_ID

  if (isEventMicrosite) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#0B1629] font-sans text-white">
        <main id="main" ref={mainRef} tabIndex={-1} className="outline-none">
          {renderPage()}
        </main>
      </div>
    )
  }

  return (
    <NavContext.Provider value={nav}>
      <div className="sqil-site min-h-screen overflow-x-hidden bg-navy-950 font-sans text-slate-300 selection:bg-amber-400/30 selection:text-white">
        <a
          href="#main"
          className="sr-only rounded-md bg-amber-400 px-4 py-2 font-semibold text-navy-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60]"
        >
          Skip to main content
        </a>
        <SiteHeader activePage={activePage} menuOpen={mobileMenuOpen} setMenuOpen={setMobileMenuOpen} />
        <main id="main" ref={mainRef} tabIndex={-1} className="pt-16 outline-none">
          {renderPage()}
        </main>
        <SiteFooter footer={content.footer} recruitment={recruitment} />
      </div>
    </NavContext.Provider>
  )
}
