# -*- coding: utf-8 -*-
"""Gerador generico de cenas Veo (9:16 8s sem audio). Uso:
   python gen_scenes.py <slug>   (le SCENES_<slug> daqui). Max 6 jobs concorrentes."""
import subprocess, concurrent.futures as cf, urllib.request, re, sys, shutil
HF=r"C:/Users/junio/AppData/Roaming/npm/higgsfield.cmd"
BASE="Vertical 9:16 cinematic mystery short for PULSO Misterios. Realistic atmosphere, strong subject clarity, no faces, no people, no readable text, no logos, no gore, no comedy. "

VOYNICH={
 "s1_book":"An ancient closed leather-bound manuscript on a dark medieval desk, candlelight, floating dust, centuries old, slow push-in, shallow depth of field.",
 "s3_pages":"Hands turning yellowed parchment pages covered in strange illegible handwritten glyphs, sepia tones, candlelight, slow movement, close-up.",
 "s4_plants":"Old manuscript pages showing illustrations of strange unknown plants and circular astrological diagrams, mystical, candlelit, slow pan.",
 "s7_alchemy":"A dim medieval alchemy study with glass bottles, dried herbs, old books and astrological instruments, golden candlelight, slow push-in.",
 "s8_hoax":"A quill pen writing mysterious invented symbols on old parchment by candlelight, extreme close-up, slow deliberate motion.",
 "s10_compare":"An ancient mysterious manuscript lying beside a plain modern hardcover book on a dark wooden table, size comparison, moody light, slow push-in.",
 "s11_secret":"An ancient closed manuscript faintly glowing with hidden secrets in a dark room, mysterious aura, drifting dust, slow push-in.",
 "s13_cta1":"A softly glowing open mystical old book on a table, warm candlelight, drifting dust particles, calm and mysterious, empty space at the top, slow movement.",
 "s14_cta2":"A calm candlelit medieval study at night with a closed ancient book, peaceful mysterious atmosphere, empty negative space, slow pull-back.",
}
COPA_POLVO={
 "s1_octopus":"A large octopus inside a softly lit aquarium tank, dark mysterious water, intelligent eye, slow push-in, cinematic.",
 "s2_boxes":"Two identical clear acrylic boxes submerged in an aquarium, a curious octopus nearby reaching out, cool blue light, slow movement.",
 "s3_choose":"Close-up of an octopus tentacle reaching toward and opening one of two underwater boxes, suspenseful, water particles, slow motion.",
 "s4_final":"A grand football stadium at night under bright floodlights, empty green pitch with a single ball at the center circle, dramatic atmosphere, slow aerial push-in.",
 "s5_trophy":"A gleaming golden football trophy on a dark reflective surface, single dramatic spotlight, awe, slow rotating shot.",
 "s6_celeb":"An aquarium tank glowing under bright spotlights with camera flashes around it in a dark room, the octopus as a star attraction, slow movement.",
 "s7_science":"Extreme macro of an octopus eye and skin texture shifting colors and contrast, scientific, deep blue tones, slow.",
 "s8_mystery":"An octopus drifting in dark mysterious water with a faint eerie glow, enigmatic suspenseful mood, slow push-in.",
 "s9_cta":"A calm glowing aquarium with soft blue light and gentle rising bubbles, wide empty space at the top, peaceful yet mysterious, slow pull-back.",
}
# Copa do cachorro (Pickles 1966) — permite cao/silhuetas, mantem sem rostos legiveis
BASE_CACHORRO=("Vertical 9:16 cinematic vintage 1966 short for PULSO. Any sport context is SOCCER (association football): "
 "round soccer ball, soccer World Cup trophy. STRICTLY NO american football, NO helmets, NO oval/pointed ball. "
 "Sepia film grain newsreel look, realistic atmosphere, animals allowed, no visible faces, no readable text, no logos, no gore, no comedy. ")
# valor = (prompt, duracao_em_s) — duracao >= span da cena (trava de fluidez) escolhendo a menor permitida
COPA_CACHORRO={
 "s1_london66":("Foggy 1966 London street at dawn, classic red double-decker bus and vintage cars, World Cup era, slow push-in.",6),
 "s2_stolen":("A gleaming golden football trophy inside a glass display case in a dim exhibition hall, then the case empty with the door ajar and a red alarm glow, tension, slow push-in.",8),
 "s3_police":("1960s British policemen searching a foggy London street at night with flashlights, seen from behind, frustration, slow movement.",6),
 "s4_dogwalk":("A small scruffy mongrel dog walking on a leash along a quiet suburban London street at dusk, only the owner's legs visible, warm grain, slow tracking shot.",6),
 "s5_sniff":("Close-up of a small dog sniffing intently at a newspaper-wrapped bundle hidden under a garden bush, evening light, curiosity, shallow depth of field, slow.",4),
 "s6_reveal":("Hands unwrapping old newspaper on the ground to reveal a gleaming golden football trophy, dramatic reveal, warm light, slow.",6),
 "s7_doghero":("A small proud mongrel dog sitting beside a shining golden World Cup trophy, heroic warm glow, slow push-in.",4),
 "s8_medal":("A small dog wearing a shiny round medal, surrounded by vintage newspaper front pages and bright camera flashbulbs in a dark room, fame, slow movement.",6),
 "s9_thief":("A shadowy unidentified figure in a long coat slipping away into the fog of a 1960s London alley, only a dark silhouette, mysterious, slow.",6),
 "s10_reflect":("Extreme close-up of a dog's nose sniffing the air with a gleaming golden trophy in soft focus behind, cinematic reflective mood, warm light, slow.",6),
 "s11_cta":("A small dog sitting calmly beside a glowing golden trophy at golden hour, warm peaceful atmosphere, wide empty space at the top, slow pull-back.",4),
}
BASE_FUTEBOL=("Vertical 9:16 cinematic modern SOCCER (association football) short for PULSO. This is SOCCER: a round "
 "black-and-white soccer ball, rectangular soccer goal with net, grass soccer pitch. STRICTLY NO american football, "
 "NO helmets, NO shoulder pads, NO oval or pointed ball, NO gridiron. Realistic stadium atmosphere, dramatic lighting, "
 "no visible faces, no team logos or crests, no readable text or numbers, no brands, generic players as silhouettes "
 "or motion blur, no gore, no comedy. ")
COPA_GOL11S={
 "s1_fast":("A packed football stadium at night under bright floodlights, extreme motion blur of a ball streaking toward the goal, sense of incredible speed, cinematic.",6),
 "s2_2002":("A grand football stadium filling with a blurred crowd before a match, two teams as distant silhouettes walking onto the green pitch, anticipation, slow aerial push-in.",6),
 "s3_kickoff":("Close-up of a football resting on the center circle of a green pitch, a player's boot approaching to kick off, stadium lights, tension, slow then motion.",6),
 "s4_goal":("A blurred defensive mistake near the goal, a striker silhouette rushing in and striking the ball into the net, the net ripples, explosive moment, motion blur.",6),
 "s5_clock":("A glowing stadium scoreboard panel at the very start of a match, dramatic close-up with only abstract glowing marks, tension, slow push-in.",4),
 "s6_record":("A gleaming golden football trophy under a single dramatic spotlight in a dark stadium tunnel, sense of history and record, slow rotating shot.",8),
 "s7_irony":("A lone football player silhouette sitting on an empty bench in a dim stadium after the crowd left, reflective ironic mood, slow.",6),
 "s8_history":("Dramatic motion-blur of a football flying into the net frozen at the peak moment, golden light, sense of a historic play, slow.",6),
 "s9_cta":("A football resting on the center of an empty floodlit pitch at night, calm and iconic, wide empty space at the top, slow pull-back.",6),
}
COPA_MILLA={
 "s1_older":("A football stadium under floodlights, an older veteran player silhouette striking the ball into the net with surprising power, motion blur, cinematic.",6),
 "s2_cameroon":("An African football player silhouette celebrating on a green pitch, green-red-yellow stadium light ambiance, pride, slow.",4),
 "s3_1990":("A vintage early-1990s football stadium packed with a blurred crowd, nostalgic warm grain, a lone veteran player walking the pitch, slow.",6),
 "s4_comeback":("A football player silhouette walking out of a dark tunnel back onto a bright floodlit pitch, comeback moment, dramatic backlight, slow push-in.",6),
 "s5_dance":("A football player celebrating by dancing next to the corner flag on a green pitch, joyful motion, stadium lights, slow motion.",8),
 "s6_fever":("A massive stadium crowd of silhouettes cheering and waving, festive celebration with lights and confetti, energetic, slow.",4),
 "s7_1994":("A football striker silhouette scoring again, ball hitting the net under floodlights, triumphant, motion blur.",8),
 "s8_record":("A gleaming golden football trophy beside a plain veteran jersey on a stand under a single spotlight, sense of a historic record, slow rotating shot.",8),
 "s9_cta":("A football resting on the center of an empty floodlit pitch at night with a single corner flag, calm and iconic, wide empty space at the top, slow pull-back.",8),
}
BASE_IA=("Vertical 9:16 cinematic futuristic tech short for PULSO IA. Sleek modern atmosphere, "
 "clean high-tech lighting, no human faces, no readable text or numbers, no brand logos, "
 "no gore, no comedy. ")
# robo que virou CEO (Sophia / Hanson Robotics 2023) ~70s
IA_CEO={
 "s1_robotoffice":("A sleek humanoid robot standing in a bright modern corporate office, glass walls, soft futuristic light, back and side view, no visible face, slow push-in.",8),
 "s2_ceochair":("A humanoid robot seated at the head of a long boardroom table in an empty glass meeting room, position of authority, cool light, slow push-in.",8),
 "s3_data":("Glowing holographic data streams and abstract rising market graphs floating in a dark high-tech room, real-time analysis feel, blue light, slow.",6),
 "s4_hongkong":("A futuristic Hong Kong skyline at dusk with glowing skyscrapers and a sleek tech headquarters, aerial, neon reflections, slow push-in.",8),
 "s5_lab":("A clean robotics laboratory with humanoid robot parts on assembly stands under bright light, no faces, scientific, slow tracking shot.",6),
 "s6_efficiency":("An abstract glowing upward arrow and rising bar graph made of light in a dark space, sense of strong growth, energetic, slow.",8),
 "s7_contrast":("Silhouettes of traditional executives in shadow on one side and a glowing humanoid robot on the other, contrast of old and new, dramatic light, slow.",6),
 "s8_brain":("A glowing artificial neural network and abstract AI brain made of light nodes pulsing in a dark room, intelligence, slow push-in.",8),
 "s9_futurework":("A modern empty office at night with a single humanoid robot working at a glowing desk, future of work, calm tech mood, slow.",6),
 "s10_cta":("A calm humanoid robot standing in soft glowing blue light, serene futuristic atmosphere, wide empty space at the top, slow pull-back.",6),
 "s11_servers":("Rows of glowing AI server racks in a dark modern data center, blue and violet light, sense of massive computing power, slow tracking shot.",6),
 "s12_global":("A glowing translucent digital globe with bright data connection lines spanning the world, global AI network, dark background, slow rotation.",6),
}
BASE_MOT=("Vertical 9:16 cinematic dramatic corporate short for PULSO Motivacional. Tense inspiring atmosphere, "
 "moody dramatic lighting, no human faces, no readable text or numbers, no brand logos, no gore, no comedy. ")
# decisao de 10 segundos (Steve Jobs / Apple 1997) ~64s
MOT_JOBS={
 "s1_boardroom":("A tense late-1990s corporate boardroom at night, long table, empty chairs, a clock on the wall, dramatic shadows, no faces, slow push-in.",8),
 "s2_failing":("A dim struggling tech company office with empty desks and an abstract falling graph of light in the background, decline, cold light, slow.",6),
 "s3_decision":("A lone figure silhouette standing at the head of a dark boardroom table making a hard decision, single dramatic spotlight, no face, slow push-in.",8),
 "s4_clock":("Extreme close-up of a ticking clock second hand in dramatic light, tension of ten seconds, shallow depth of field, slow.",6),
 "s5_cut":("Many glowing product silhouettes on a dark table fading away leaving only four glowing objects, focus and simplicity, dramatic light, slow.",8),
 "s6_simple":("A clean minimalist dark desk with a single glowing sleek device under a focused spotlight, simplicity as power, slow push-in.",6),
 "s7_transform":("A dark room gradually filling with bright golden light, rising energy of transformation and rebirth, cinematic, slow.",8),
 "s8_devices":("Sleek modern generic devices displayed on a glowing pedestal in a dark gallery, innovation, no logos, slow rotating shot.",6),
 "s9_cta":("A single sleek device glowing on an empty pedestal in soft light, calm iconic mood, wide empty space at the top, slow pull-back.",8),
 "s10_legacy":("A single glowing path of light leading forward into the dark toward a bright horizon, sense of a bold new beginning and legacy, cinematic, slow push-in.",8),
}
BASE_MARACANA=("Vertical 9:16 cinematic vintage 1950 World Cup SOCCER (association football) short for PULSO. This is "
 "SOCCER: round soccer ball, rectangular soccer goal with net, grass soccer pitch. STRICTLY NO american football, "
 "NO helmets, NO shoulder pads, NO oval or pointed ball, NO gridiron. Black-and-white / sepia newsreel film grain, "
 "period atmosphere, no visible faces, no readable text or numbers, no team logos or crests, generic players as "
 "silhouettes or motion blur, no gore, no comedy. ")
# Maracanazo 1950 (Brasil 1x2 Uruguai) — ~60s
COPA_MARACANAZO={
 "s1_silence":("A massive packed 1950 football stadium crowd falling into stunned silence, thousands of blurred spectators frozen in shock, vintage sepia newsreel, no faces, slow push-in.",6),
 "s2_maracana":("A grand 1950s football stadium completely packed with a vast blurred crowd, monumental scale, black-and-white film grain, slow aerial push-in.",4),
 "s3_festa":("A vintage 1950 stadium crowd celebrating early with waving flags and confetti, festive anticipation, sepia film grain, slow.",4),
 "s4_jogo":("Vintage 1950 football match action, player silhouettes battling for the ball on a grass pitch, motion blur, black-and-white newsreel, dynamic.",4),
 "s5_gol":("A football striking the back of the net in a vintage 1950 stadium, the decisive goal, the net ripples, dramatic black-and-white, motion blur.",6),
 "s6_emudeceu":("A huge packed vintage stadium crowd frozen in heavy silence and disbelief, somber mood, sepia film grain, slow.",4),
 "s7_trauma":("A vast empty vintage football stadium at dusk after the match, lone and melancholic, sepia, drifting dust, slow.",4),
 "s8_uniforme":("A plain white football jersey on a wooden stand under soft light, then fading toward a bright yellow jersey, transformation, no logos, slow.",6),
 "s9_amarela":("A bright glowing yellow football jersey on a stand, pride rising from defeat, warm light against dark, slow push-in.",4),
 "s10_cta":("A single football resting on the center of an empty grassy pitch at golden dusk, calm and iconic, wide empty space at the top, slow pull-back.",4),
}
BASE_INFANTIL=("Vertical 9:16 bright playful children's storybook illustration short for PULSO Infantil. "
 "Colorful whimsical cartoon style, cheerful daytime light, no human faces, no readable text or numbers, "
 "no brand logos, no gore, friendly and wholesome. ")
# O sapato desaparecido (Charlie, Bath 2019, cachorro travesso) ~46s
INFANTIL_SAPATO={
 "s1_shoe":("A colorful child's sneaker with a playful superhero bat-shaped design sitting alone on a wooden floor, bright storybook style, soft light, slow push-in.",6),
 "s2_house":("A cozy bright children's bedroom full of toys, something missing, whimsical cartoon illustration, cheerful, slow pan.",6),
 "s3_search":("A child's hands holding a flashlight looking under a bed for something, no face, playful storybook style, bright.",6),
 "s4_friends":("A cheerful sunny neighborhood path leading toward a park, a little adventure beginning, colorful storybook illustration, no people, bright whimsical cartoon, slow.",6),
 "s5_park":("A sunny colorful park with green trees and a playground, whimsical storybook illustration, bright cheerful daytime, slow.",6),
 "s6_clue":("A trail of muddy footprints from a single foot on a park path, playful mystery, bright cartoon storybook style.",6),
 "s7_follow":("Following a trail of footprints toward leafy bushes and trees in a sunny park, adventurous whimsical cartoon, bright.",6),
 "s8_dog":("A playful mischievous cartoon puppy hiding behind trees holding a colorful sneaker in its mouth, cheerful storybook style, no text.",6),
 "s9_found":("The colorful superhero sneaker happily recovered with little sparkles, joyful bright resolution, whimsical cartoon.",6),
 "s10_cta":("A cheerful bright storybook scene with a colorful sneaker and a friendly puppy, wide empty space at the top, playful, slow pull-back.",6),
}
BASE_PSICO=("Vertical 9:16 cinematic psychology short for PULSO Psicologia. Moody nighttime atmosphere, abstract brain "
 "and mind visuals, deep blue and violet tones, no visible faces, no people, no readable text, no logos, no gore, "
 "contemplative and calm. ")
# Por que o cerebro lembra vergonhas antigas as 3 da manha (ruminacao / rede de modo padrao) ~59s
PSICO_VERGONHAS={
 "s1_awake":("A dark quiet bedroom at night with dim blue moonlight through a window, still and restless atmosphere, no people, slow push-in.",6),
 "s2_flash":("An abstract flickering fragment of an old faded memory in darkness, like a damaged film frame, melancholic blue tones, slow.",6),
 "s3_brain":("A glowing human brain floating in dark space with softly firing neurons, abstract scientific, blue and violet, slow rotation.",6),
 "s4_night":("A silent dark room at night, total stillness, no distractions, moody deep blue, very slow push-in.",6),
 "s5_network":("An abstract glowing neural network lighting up across a dark brain, interconnected threads of blue light, slow.",6),
 "s6_file":("An abstract glowing folder reopening in darkness, light and fragments spilling out, metaphor for a reopened memory, moody.",6),
 "s7_alarm":("A soft pulsing red glow inside part of a dark brain, like a quiet alarm, abstract scientific, slow pulse.",6),
 "s8_naming":("The red glow softening into gentle calm blue light inside the brain, a sense of relief and settling, abstract, slow.",6),
 "s9_calm":("Neurons in the brain slowly calming as soft warm dawn light begins to enter a dark room, peaceful, slow.",6),
 "s10_cta":("A peaceful bedroom at first dawn light, calm and quiet, wide empty space at the top, gentle, slow pull-back.",6),
}
BASE_TRAILER=("Vertical 9:16 cinematic teaser trailer for PULSO — a curiosity and mystery brand. Bold cinematic "
 "atmosphere, intriguing and premium, deep rich colors with glowing light, no visible faces, no people, no readable "
 "text, no logos, no gore. ")
# Trailer de divulgacao do canal PULSO ~20s
TRAILER_PULSO={
 "s1_hook":("A mysterious dark archive room with an old door slightly open and warm light spilling out, hidden secrets, cinematic, slow push-in.",4),
 "s2_science":("An abstract glowing cosmic and scientific visual with stars, particles and energy in deep space, sense of wonder, cinematic, slow.",4),
 "s3_world":("A breathtaking surreal aerial view of Earth and nature blending into abstract patterns, awe and discovery, cinematic, slow.",4),
 "s4_fast":("A dynamic abstract burst of light streaks and motion through darkness, fast energetic montage feel, cinematic.",4),
 "s5_brand":("A glowing pulse heartbeat line of light pulsing across a dark cinematic background, iconic and bold, slow.",4),
 "s6_cta":("A calm cinematic dark scene with a single glowing point of light, wide empty space at the top, mysterious and inviting, slow pull-back.",4),
}
# MH370 (misterio aviacao) ~55s — usa BASE default (misterio)
MH370={
 "s1_vanish":("A commercial airplane silhouette disappearing into thick dark clouds at night, ominous and mysterious, cinematic, slow.",8),
 "s2_takeoff":("A passenger jet taking off from a runway at dusk, dramatic sky, cinematic wide shot, no logos.",8),
 "s3_radar":("A dark air traffic radar screen with a single blip fading away, green glow in a control room, eerie, slow.",8),
 "s4_silence":("An empty air traffic control room at night with glowing screens and total silence, tense, cinematic.",8),
 "s5_turn":("A passenger airplane making an unexpected turn over a vast dark ocean seen from high above, lonely, cinematic aerial.",8),
 "s6_ocean":("A vast empty dark ocean at night under faint moonlight, immense and lonely, cinematic slow drift.",8),
 "s7_debris":("A weathered piece of airplane wreckage washed up on a remote empty beach, melancholic, cinematic close.",8),
 "s8_search":("Search vessels with spotlights scanning an enormous dark ocean at night, vast and futile, cinematic.",8),
 "s9_enigma":("A glowing question mark of light hovering over a dark ocean horizon, mystery and the unknown, cinematic.",8),
 "s10_cta":("A calm dark ocean horizon at first light of dawn, mysterious and quiet, wide empty space at the top, slow pull-back.",8),
}
# Cerebro preguicoso (efeito Einstellung) ~40s — BASE_PSICO (cerebro)
CEREBRO_PREG={
 "s1_brain":("A glowing human brain in dark space conserving energy with a dim pulsing light, abstract scientific, blue and violet, slow.",8),
 "s2_puzzle":("An abstract glowing puzzle with pieces locking into one single path while easier paths fade away, fixed thinking, cinematic.",8),
 "s3_chess":("An abstract glowing chessboard with one highlighted move while better moves dim around it, strategy metaphor, cinematic.",8),
 "s4_familiar":("A single bright familiar path glowing while alternative routes stay dark, the brain taking the easy route, abstract.",8),
 "s5_challenge":("Dim neurons suddenly sparking awake with bright new connections, the brain being challenged, abstract energetic.",8),
 "s6_insight":("A brain lighting up with fresh new pathways and brighter energy, a moment of insight, abstract uplifting, slow.",8),
 "s7_cta":("A calmly glowing brain on a clean dark background, wide empty space at the top, inviting, slow pull-back.",8),
}
BASE_CORES=("Vertical 9:16 cinematic vibrant color-psychology short for PULSO. Rich saturated vivid colors, clean modern "
 "aesthetic, abstract textures of flowing fabric, ink in water, light and paint, no visible faces, no people, no readable "
 "text, no logos, no gore, elegant and uplifting. ")
# A cor da sua roupa pode mudar o seu humor (psicologia das cores) ~60s — BASE_CORES
COR_HUMOR={
 "s1_red":("Bold vibrant red silk fabric flowing dramatically in slow motion, powerful and confident, rich saturated red, cinematic, slow.",6),
 "s2_spectrum":("A flowing rainbow spectrum of vivid colors blending and swirling together like liquid light, emotions in color, cinematic, slow.",6),
 "s3_blue":("Deep blue ink swirling and blooming in clear water with elegant flowing shapes, calm creativity, cinematic, slow.",6),
 "s4_yellow":("Warm glowing golden-yellow light with floating shimmering particles and soft sunlight, pure happiness, cinematic, slow.",6),
 "s5_green":("Lush vivid green leaves with soft sunlight filtering through, fresh and calming, relaxation, cinematic, slow.",6),
 "s6_brain":("An abstract glowing brain connected by colored threads of light to floating swatches of color, color and emotion science, cinematic, slow.",6),
 "s7_passion":("An intense glowing burst of vivid red and orange energy radiating outward, passion and energy, cinematic, slow.",6),
 "s8_palette":("An elegant array of vibrant colored paint swatches and folded fabrics arranged like a daily palette, choice of color, cinematic, slow.",6),
 "s9_wardrobe":("A row of colorful clothes neatly on hangers in a bright softly lit closet, no people, inviting, cinematic, slow.",6),
 "s10_cta":("A clean soft vibrant color-gradient background, calm and inviting, wide empty space at the top, cinematic, slow pull-back.",6),
}
BASE_HISTORIA=("Vertical 9:16 cinematic vintage 1914 historical short for PULSO. Somber muted wartime tones, snow and "
 "candlelight, World War One era atmosphere, no visible faces, no people, no readable text, no logos, no gore, "
 "melancholic and human. ")
# Tregua de Natal 1914 (uma cancao parou a guerra) ~60s — BASE_HISTORIA, SEM pessoas
TREGUA_NATAL={
 "s1_trench":("A cold muddy empty World War One trench at dusk on Christmas Eve 1914, light snow falling, somber, vintage cinematic, no people, slow.",8),
 "s2_noman":("A desolate snowy no-man's-land between two empty trench lines at night, barbed wire, moody vintage, no people, slow.",8),
 "s3_war":("Distant smoke and a faint glow of artillery over a dark battlefield horizon, tense, vintage cinematic, no people, slow.",8),
 "s4_candle":("A single warm candle glowing inside a dark empty trench on Christmas night, intimate and hopeful, vintage, slow push-in.",8),
 "s5_lights":("Small warm lanterns and lights appearing along both empty snowy trench lines in the dark night, hopeful, vintage, slow.",8),
 "s6_truce":("A quiet snowy no-man's-land at night softly lit by lanterns, peaceful stillness, an unofficial truce, vintage cinematic, no people, slow.",8),
 "s7_gifts":("Small wrapped gifts and a glowing lantern resting on the snow between trenches, warmth and exchange, vintage close, slow.",8),
 "s8_ball":("A worn vintage leather SOCCER ball (round association football) resting on snowy ground in no-man's-land, 1914, no people, vintage, slow.",8),
 "s9_dawn":("Soft Christmas dawn light breaking over a calm snowy battlefield, hope and humanity, vintage cinematic, no people, slow.",8),
 "s10_cta":("A single warm candle glowing on fresh snow at dawn, peaceful and human, wide empty space at the top, vintage, slow pull-back.",8),
}
BASE_FOCO=("Vertical 9:16 cinematic clean modern productivity short for PULSO. Warm focused study atmosphere, tidy desk, "
 "soft lamp light, calm and motivating, no visible faces, no people, no readable text, no logos, no gore. ")
# Tecnica Pomodoro / blocos de 25 minutos (produtividade) ~60s — BASE_FOCO, SEM pessoas
POMODORO={
 "s1_timer":("A clean modern tomato-shaped kitchen timer on a tidy desk in warm focused light, no people, cinematic, slow push-in.",8),
 "s2_desk":("A tidy organized study desk with books, an open notebook and a warm lamp, focused calm atmosphere, no people, cinematic, slow.",8),
 "s3_25min":("A close-up of a timer dial set to twenty-five minutes ticking in warm light, focus and time, cinematic, slow.",8),
 "s4_break":("A calm cup of coffee by a window with soft daylight, a short relaxing pause, cozy, no people, cinematic, slow.",8),
 "s5_focus":("An abstract glowing brain with steady focused light, deep concentration, clean cinematic, slow.",8),
 "s6_marathon":("An empty long running track at dawn stretching far ahead, metaphor for endurance, cinematic, no people, slow.",8),
 "s7_sprint":("Abstract energetic bursts of light pulsing in short rhythmic intervals, sprints of focus, dynamic clean, slow.",8),
 "s8_office":("A sleek modern productive office space with warm light and clean desks, success and productivity, no people, cinematic, slow.",8),
 "s9_learn":("An abstract brain lighting up with organized flowing streams of knowledge, a learning machine, clean uplifting, slow.",8),
 "s10_cta":("A clean tidy desk with a tomato timer and warm lamp light, inviting and calm, wide empty space at the top, cinematic, slow pull-back.",8),
}
SETS={"voynich":VOYNICH,"copa_polvo":COPA_POLVO,"copa_cachorro":COPA_CACHORRO,"copa_gol11s":COPA_GOL11S,"copa_milla":COPA_MILLA,"ia_ceo":IA_CEO,"mot_jobs":MOT_JOBS,"copa_maracanazo":COPA_MARACANAZO,"infantil_sapato":INFANTIL_SAPATO,"psico_vergonhas":PSICO_VERGONHAS,"trailer_pulso":TRAILER_PULSO,"mh370":MH370,"cerebro_preguicoso":CEREBRO_PREG,"cor_humor":COR_HUMOR,"tregua_natal":TREGUA_NATAL,"pomodoro":POMODORO}
BASE_BY={"copa_cachorro":BASE_CACHORRO,"copa_gol11s":BASE_FUTEBOL,"copa_milla":BASE_FUTEBOL,"ia_ceo":BASE_IA,"mot_jobs":BASE_MOT,"copa_maracanazo":BASE_MARACANA,"infantil_sapato":BASE_INFANTIL,"psico_vergonhas":BASE_PSICO,"trailer_pulso":BASE_TRAILER,"cerebro_preguicoso":BASE_PSICO,"cor_humor":BASE_CORES,"tregua_natal":BASE_HISTORIA,"pomodoro":BASE_FOCO}
slug=sys.argv[1]; OUT=f"D:/tmp/pulso_lote4/{slug}/clips"
# WORKER-READY: se existir scenes.json (gerado pela rota /api/automation/gerar-cenas),
# usa ele (base + cenas dinamicas); senao cai no dict fixo deste arquivo.
import json as _json, os as _os
_SJ=f"D:/tmp/pulso_lote4/{slug}/scenes.json"
if _os.path.exists(_SJ):
    _d=_json.load(open(_SJ,encoding="utf-8"))
    SC={s["name"]:(s["prompt"], int(s.get("dur",8))) for s in _d["scenes"]}
    _BASE=_d["base"]
    print(f"[gen_scenes] usando scenes.json ({len(SC)} cenas, worker)",flush=True)
else:
    SC=SETS[slug]; _BASE=BASE_BY.get(slug,BASE)
_ORDER=list(SC.keys()); _USADOS=set()   # banco de clips: ordem das cenas + clips já usados neste render
def _split(v):
    return (v,8) if isinstance(v,str) else (v[0],v[1])
def _valido(path):
    # clip abre no ffprobe? pega download truncado / "moov atom not found" (falha silenciosa do Veo)
    try:
        if not (os.path.exists(path) and os.path.getsize(path)>50000): return False
        r=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",path],
            capture_output=True,text=True,timeout=30)
        return r.returncode==0 and (r.stdout or "").strip() not in ("","N/A","0.000000")
    except Exception:
        return False
def _baixar_ok(url,out):
    # baixa e valida; 1 re-download se vier corrompido (o Veo às vezes corta o arquivo)
    for _ in range(2):
        try: urllib.request.urlretrieve(url,out)
        except Exception: continue
        if _valido(out): return True
    return False
def gen(name):
    out=f"{OUT}/{name}.mp4"
    # SÓ pula se o clip existente for VÁLIDO (antes: skip por tamanho>0 mantinha clip corrompido pra sempre)
    if _valido(out): return (name,"SKIP","ja existe")
    if os.path.exists(out):
        try: os.remove(out)  # corrompido: remove e regenera
        except Exception: pass
    pr,dur=_split(SC[name])
    # BANCO DE CLIPS: tenta reusar antes de gastar Veo (cena = só o prompt, sem a base de estilo)
    try:
        import banco_clips as bc
        _idx=_ORDER.index(name)
        hit=bc.buscar_semantico(pr,dur,idx_cena=_idx,usados_run=_USADOS) or bc.buscar(pr,dur,idx_cena=_idx,usados_run=_USADOS)
        if hit:
            shutil.copy2(hit["file"],out); _USADOS.add(hit["id"])
            if _valido(out):  # clip do banco também pode estar corrompido — só reusa se abrir
                bc.usar(hit["id"]); return (name,"REUSO",hit["id"])
            try: os.remove(out)
            except Exception: pass
    except Exception: pass
    full=_BASE+pr
    # ACERVO REAL (Pexels/Pixabay) — custo ZERO. Se existe filmagem de verdade que serve,
    # não faz sentido queimar cota de IA. Só cai pro Wan quando o acervo não tem nada.
    try:
        import stock_gen
        oks,fonte,_=stock_gen.gerar(pr,dur,out)
        if oks and _valido(out):
            try:
                import banco_clips as bc; bc.adicionar(pr,dur,out,tema=slug,modelo=fonte,usd=0.0)
            except Exception: pass
            return (name,"OK","stock:"+fonte)
    except Exception as e:
        print(f"      [stock] excecao {e}",flush=True)
    # WAN depois (b-roll ~US$0,10/s, cota grátis) — Veo/Higgsfield vira fallback (caro).
    try:
        import wan_gen
        okw,modelo,usd=wan_gen.gerar(full,dur,out)
        if okw and _valido(out):
            try:
                import banco_clips as bc; bc.adicionar(pr,dur,out,tema=slug,modelo=modelo,usd=usd)  # durável
            except Exception: pass
            return (name,"OK","wan:"+modelo)
    except Exception as e:
        print(f"      [wan] excecao {e}",flush=True)
    # FALLBACK Veo (Higgsfield) — só se o Wan não entregou
    for tent in range(2):
        r=subprocess.run([HF,"generate","create","veo3_1_lite","--prompt",full,
            "--aspect_ratio","9:16","--duration",str(dur),"--wait","--wait-timeout","18m","--wait-interval","10s"],
            capture_output=True,text=True,timeout=1200)
        sout=(r.stdout or "")+(r.stderr or "")
        m=re.findall(r"https?://\S+\.mp4",sout)
        if not m: return (name,"ERRO",sout[-160:])
        if _baixar_ok(m[-1],out):
            try:
                import banco_clips as bc; bc.adicionar(pr,dur,out,tema=slug,modelo="veo",usd=dur*1.0)  # clip novo (válido) entra no banco
            except Exception: pass
            return (name,"OK","veo:"+m[-1])
    return (name,"ERRO","clip corrompido nas 2 tentativas (wan+veo)")
if __name__=="__main__":
    import os; os.makedirs(OUT,exist_ok=True)
    names=list(SC.keys())
    custo=sum(_split(SC[n])[1] for n in names)
    # WAN é o gerador primário e roda em cota grátis (fora do teto de crédito Veo). Se a chave Wan
    # existe, passa override no guard — o teto Veo só vale quando cai no fallback caro.
    _wan_on=False
    try:
        for _ln in open("D:/projetos/pulso_control/.env",encoding="utf-8",errors="ignore"):
            if _ln.startswith("DASHSCOPE_API_KEY_SG=") and _ln.split("=",1)[1].strip().strip('"'): _wan_on=True
    except Exception: pass
    try:
        import pulso_guard as g
        _ok=g.autorizar(custo, override=("Wan b-roll (cota gratis, fora do teto Veo)" if _wan_on else None))
        if not _ok: print("GUARD bloqueou."); sys.exit(1)
    except SystemExit: raise
    except Exception as e:
        print("GUARD bloqueou/erro:",e); sys.exit(1)
    print(f"gerando {len(names)} cenas ({slug}), custo {custo}cr, max 6 concorrentes...",flush=True)
    res={}
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        futs={ex.submit(gen,n):n for n in names}
        for f in cf.as_completed(futs):
            n,st,info=f.result(); res[n]=st; print(f"  {n:12} {st}  {info[:70]}",flush=True)
    bad=[n for n,s in res.items() if s not in ("OK","SKIP","REUSO")]
    ok=sum(1 for s in res.values() if s=="OK"); skip=sum(1 for s in res.values() if s=="SKIP")
    reuso=sum(1 for s in res.values() if s=="REUSO")
    _cr_eco=sum(_split(SC[n])[1] for n,s in res.items() if s=="REUSO")
    print(f"(novos Veo={ok}, reusados do banco={reuso} ~{_cr_eco}cr economizados, ja existiam={skip})")
    try:
        import pulso_guard as g
        _cr=sum(_split(SC[n])[1] for n in names if res.get(n)=="OK")
        g.registrar_gasto("higgsfield", _cr, _cr*1.0, f"{slug} cenas")
    except Exception: pass
    if bad:
        # NADA de DONE com cena faltando — o make_video crasharia adiante de forma críptica.
        # O worker lê a ausência de DONE e marca render_status=erro com motivo claro.
        print(f"\nFALHOU: {len(bad)} cenas nao geradas: {bad} ({ok} ok, {reuso} reuso)",flush=True)
        sys.exit(1)
    print(f"\nDONE: {ok} ok, {reuso} reuso (~{_cr_eco}cr eco), {len(bad)} falhas: {bad}",flush=True)
    try:
        import banco_clips as bc; bc.sincronizar_supabase()  # atualiza o resumo do banco no app
    except Exception: pass
