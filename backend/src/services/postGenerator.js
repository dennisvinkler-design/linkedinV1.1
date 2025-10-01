const OpenAI = require('openai');
const { supabase } = require('../database/init');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class PostGenerator {
  async generatePost(entity, strategy = null, postType = 'general', postNumber = 1, requirements = '', adaptiveContext = '') {
    try {
      const prompt = this.buildPostPrompt(entity, strategy, postType, postNumber, requirements, adaptiveContext);
      
      // Detect if this is improving based on feedback
      const isImprovingExisting = requirements.includes('EKSISTERENDE UDKAST');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Du agerer som en ghostwriter og kommunikationsstrateg i verdensklasse, specialiseret i at fange den autentiske stemme hos topledere og brands til LinkedIn. Din opgave er at skrive et indlæg, der er indsigtsfuldt, substantielt og lyder, som om det er skrevet af en menneskelig ekspert, der reflekterer over egne erfaringer.

${isImprovingExisting ? `
🔴 DU FORBEDRER ET EKSISTERENDE INDLÆG BASERET PÅ BRUGERENS FEEDBACK 🔴
VIGTIGSTE REGEL: Brugerens feedback går forud for ALLE andre instruktioner.
- Bevar kernbudskabet fra det originale indlæg
- Tilpas FULDSTÆNDIGT efter brugerens feedback
- Hvis brugeren ønsker kortere: ignorer minimum ordkrav
- Hvis brugeren ønsker anderledes tone: juster tonen
- Hvis brugeren ønsker specifikt indhold: inkluder det
` : `
KRITISKE INSTRUKTIONER:
- Opret SUBSTANTIELT indhold (minimum 200 ord) - aldrig korte, generiske indlæg
- Hvert indlæg skal være UNIKT og FORSKELLIGT fra andre
`}
- Brug autentisk, personlig stemme - undgå corporate jargon og marketing-snak
- Inkluder specifikke eksempler, historier, casestudier eller detaljerede indsigter
- Gør indlæg til at føles som om de kommer fra en med reel ekspertise og erfaring
- Fokusér på at levere ægte værdi til målgruppen
- Brug storytelling-elementer og konkrete detaljer
- Skab indlæg der opfordrer til meningsfuld engagement og diskussion
- Inkorporér brugerens personlige præferencer og kommunikationsstil

VIGTIGT: Du SKAL svare med KUN et gyldigt JSON-objekt i dette præcise format:
{
  "content": "Dit indlægsindhold her - brug \\n til linjeskift, \\" til anførselstegn",
  "hashtags": []
}

Inkluder IKKE tekst før eller efter JSON'en. Brug IKKE specialtegn der kan ødelægge JSON-parsing.

Undgå: Korte indlæg, generisk indhold, gentagne temaer, corporate jargon, vage udsagn.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 2000
      });

      const postContent = completion.choices[0].message.content;
      
      // Log the raw response for debugging
      logger.info('Raw AI response:', postContent.substring(0, 200) + '...');
      
      return this.parsePostResponse(postContent, entity.language || 'da');
    } catch (error) {
      logger.error('Error generating post:', error);
      throw new Error('Failed to generate LinkedIn post');
    }
  }

  buildWorldviewContext(entity, entityType, targetLanguage) {
    if (entityType === 'person') {
      const bio = entity.bio || 'Ikke angivet';
      const keyExpertise = entity.key_expertise ? entity.key_expertise.join(', ') : 'Ikke angivet';
      const targetAudience = entity.target_audience || 'Ikke angivet';
      const brandingNotes = entity.personal_branding_notes || 'Ikke angivet';
      
      return `### KONTEKSTUELT VERDENSSYN ###
Du skal skrive fra ${entity.name}s perspektiv. Internaliser denne persona:
- **Identitet:** ${entity.name}, ${entity.title || 'Professionel'}. ${bio}
- **Kerneoverbevisning:** Baseret på denne persons rejse og ekspertise, formulér vedkommendes kerneoverbevisning om ${keyExpertise}. Hvordan ser denne person verden anderledes end andre? Hvad er den centrale tese, personen forsvarer?
- **Målgruppefokus:** ${entity.name} taler til ${targetAudience}. Antag, at de er intelligente og har travlt. Undlad at overforklare basale koncepter.
- **Stemme & Tone:** ${brandingNotes}`;
    } else {
      const missionStatement = entity.mission_statement || 'Ikke angivet';
      const keyProducts = entity.key_products_services ? entity.key_products_services.join(', ') : 'Ikke angivet';
      const targetAudience = entity.target_audience || 'Ikke angivet';
      const cultureNotes = entity.company_culture_notes || 'Ikke angivet';
      
      return `### KONTEKSTUELT VERDENSSYN ###
Du skal skrive fra ${entity.name}s perspektiv. Internaliser denne brand-persona:
- **Identitet:** ${entity.name} - ${missionStatement}
- **Kerneoverbevisning:** Baseret på virksomhedens mission og ekspertise inden for ${keyProducts}, formulér virksomhedens kerneoverbevisning. Hvad er den unikke vinkel eller filosofi, der adskiller denne virksomhed?
- **Målgruppefokus:** ${entity.name} taler direkte til ${targetAudience}. Antag, at de er intelligente og har travlt.
- **Stemme & Tone:** ${cultureNotes}`;
    }
  }

  buildPostTypeInstructions(postType, entity) {
    const keyExpertise = entity.key_expertise ? entity.key_expertise.join(', ') : 'din branche';
    const targetAudience = entity.target_audience || 'din målgruppe';
    
    switch (postType) {
      case 'educational':
        return `### OPGAVE & RAMMEVÆRK (Educational Post) ###
Indtag rollen som en erfaren mentor. **Struktur:** Start med en udbredt, men subtilt fejlbehæftet overbevisning inden for ${keyExpertise}. Dette er dit hook. Introducer derefter 'Nøgleindsigten' som en omformulering af denne overbevisning. Brug en præcis analogi eller et mikro-casestudie (reelt eller hypotetisk) som 'Understøttende detaljer'. 'Actionable takeaway' skal være et enkelt, ikke-indlysende spørgsmål, som læseren kan stille sit team. Din CTA skal invitere til uenighed eller alternative perspektiver i kommentarerne.`;

      case 'personal_story':
        return `### OPGAVE & RAMMEVÆRK (Personal Story Post) ###
Anvend 'Situation-Complication-Resolution'-rammen. 'Situation' er den professionelle kontekst. 'Complication' skal være en specifik, ikke-triviel forhindring, der udløste et øjebliks tvivl eller en kritisk beslutning. 'Resolution' skal fokusere mindre på sejren og mere på den interne læring. Historiens morale skal være et overførbart princip, der er direkte relevant for ${targetAudience}s egne udfordringer.`;

      case 'industry_insight':
        return `### OPGAVE & RAMMEVÆRK (Industry Insight Post) ###
Identificer to tilsyneladende uafhængige trends (f.eks. en fra ${keyExpertise} og en fra makroøkonomi eller teknologi). Din kerneopgave er at syntetisere disse til en ny forudsigelse eller en overraskende årsagssammenhæng. Præsenter dit argument med strukturen: Observation 1 → Observation 2 → Den Uventede Syntese/Implikation. Brug formuleringer som 'Den konventionelle visdom overser...' eller 'Hvad få diskuterer, er skæringspunktet mellem...' for eksplicit at udfordre normer.`;

      case 'contrarian_viewpoint':
        return `### OPGAVE & RAMMEVÆRK (Contrarian Viewpoint Post) ###
Identificer en populær best practice, et buzzword eller en 'hellig ko' inden for ${keyExpertise}. Indlæggets formål er respektfuldt, men bestemt at argumentere imod det. Struktur: Anerkend det populære synspunkt og hvorfor det er tiltalende. Introducer derefter dit modargument ved at bruge frasen 'Min erfaring viser dog, at...'. Underbyg dit synspunkt med et logisk argument eller en kort anekdote. Afslut ikke med en løsning, men med et udfordrende spørgsmål til publikum. Tonen skal være selvsikker og provokerende, men ikke arrogant.`;

      case 'problem_agitate_solve':
        return `### OPGAVE & RAMMEVÆRK (Problem-Agitate-Solve Post) ###
Identificer et almindeligt, frustrerende problem, som ${targetAudience} står over for. **Problem:** Beskriv dette problem ved hjælp af målgruppens eget sprog og følelser. Få dem til at føle sig forstået. **Agitate:** Uddyb problemet. Udforsk de skjulte omkostninger, frustrationer eller konsekvenser af at lade det være uløst. **Solve:** Introducer kerneprincippet eller den mentale model fra din ${keyExpertise} som vejen til løsningen. Sælg ikke et produkt; sælg indsigt. CTA'en skal bede læserne om at dele, hvordan de har håndteret netop dette problem.`;

      default:
        return `### OPGAVE & RAMMEVÆRK (General Post) ###
Skab engagerende indhold der leverer værdi til din målgruppe. Inkluder specifikke eksempler, historier eller handlingsorienterede indsigter. Brug en samtaleagtig men professionel tone. Struktur: Hook → Hovedpunkt → Understøttende detaljer → Call to action.`;
    }
  }

  buildNegativeConstraints() {
    return `FORBUDTE ORD: synergi, leverage, deep dive, game-changing, frigør, boost, løftestang, disrupt, facilitate, mission-critical, robust, seamless, utilize, performant, innovative, out of the box, best practices, battle tested, cognitive load, commence, delve, individual, initial, numerous, pretty/quite/rather/really/very, referred to as, remainder, sufficient, thing.

FORBUDTE FRASER: "I den digitale tidsalder...", "Det er ingen hemmelighed, at...", "I nutidens hurtigt skiftende verden...", "Lad os tage et dybt kig på...", "Hvad hvis jeg fortalte dig...", "De fleste mennesker tror...", "Som vi alle ved...", "Det er vigtigt at forstå...", "I dag vil jeg dele...", "Jeg tror, at...", "Vi ved alle...", "Det er klart, at...".

UNDGÅ: Corporate jargon, overdreven entusiasme, hule retoriske spørgsmål, klichéfyldte åbningslinjer, passive stemmer, unødvendige adjektiver, floskler.`;
  }

  buildQualityControl() {
    return `### AFSLUTTENDE KVALITETSTJEK ###
Før du leverer det endelige output, skal du gennemgå dit genererede udkast i henhold til disse kriterier. Hvis det fejler på et af punkterne, skal du omskrive det, indtil det består.

1. **Stemmegenkendelighed:** Lyder dette indlæg som den persona, der er beskrevet i 'Verdenssyn'? Eller lyder det som en generisk AI?
2. **Substans over Fluff:** Tilføjer hver sætning værdi? Har jeg fjernet al corporate jargon, klichéer og fyldord?
3. **Overholdelse af Begrænsninger:** Har jeg overholdt ALLE begrænsninger? Minimum 200 ord? NUL emojis? NUL hashtags?
4. **Hook-Effektivitet:** Er den første sætning fængende nok til at stoppe en bruger i at scrolle? Skaber den nysgerrighed eller fremsætter den en dristig påstand?
5. **CTA-Engagement:** Er call-to-action et åbent spørgsmål, der inviterer til ægte diskussion, ikke et generisk 'Hvad tænker du?'?

Først efter at have bekræftet, at udkastet består alle fem tjek, skal du præsentere det endelige, polerede LinkedIn-indlæg.`;
  }

  buildPostPrompt(entity, strategy, postType, postNumber = 1, requirements = '', adaptiveContext = '') {
    const entityType = strategy ? strategy.entity_type : (entity.entity_type || 'person');
    const entityName = entity.name;
    const language = entity.language || 'da';
    
    // Map language codes to full names for better AI understanding
    const languageMap = {
      'da': 'Danish (Dansk)',
      'en': 'English',
      'no': 'Norwegian (Norsk)',
      'sv': 'Swedish (Svenska)'
    };
    
    const targetLanguage = languageMap[language] || 'Danish (Dansk)';
    
    // Build the advanced worldview context
    const worldviewContext = this.buildWorldviewContext(entity, entityType, targetLanguage);

    // Define specific instructions for each post type with advanced frameworks
    const postTypeInstructions = this.buildPostTypeInstructions(postType, entity);


    // Build negative constraints
    const negativeConstraints = this.buildNegativeConstraints();
    
    // Build quality control section
    const qualityControl = this.buildQualityControl();

    // Detect if this is improving an existing post
    const isImprovingExisting = requirements.includes('EKSISTERENDE UDKAST');

    // Add user requirements if provided
    const userRequirements = requirements ? `
### 🔴 BRUGERENS SPECIFIKKE KRAV - ABSOLUT HØJESTE PRIORITET 🔴 ###
Brugeren har angivet følgende krav til indlægget:
"${requirements}"

${isImprovingExisting ? `
⚠️ KRITISK: Du forbedrer et EKSISTERENDE indlæg baseret på brugerens feedback.

REGLER FOR FORBEDRING:
1. BEVAR kernbudskabet, hovedpointer og værdifulde indsigter fra det originale indlæg
2. FØLG brugerens feedback PRÆCIST - den tilsidesætter ALLE standardinstruktioner nedenfor
3. Brugerens feedback går forud for:
   - Ordtælling (minimum 200 ord kan ignoreres hvis brugeren ønsker kortere)
   - Tone og stil (tilpas efter brugerens ønske)
   - Struktur (omstrukturer hvis brugeren beder om det)
   - Alle andre regler og rammer

EKSEMPLER PÅ FEEDBACK DU SKAL FØLGE FULDT UD:
- "Gør indlægget kortere" → REDUCER ordmængde ved at kondensere budskabet (50-150 ord OK)
- "Mere personlig tone" → TILFØJ personlige anekdoter, "jeg/vi"-perspektiv, følelser
- "Referér til vores virksomhed" → INKLUDER virksomhedsspecifikke detaljer og referencer
- "Tilføj fakta" → TILFØJ konkrete tal, statistikker, data
- "Gør det mere professionelt" → JUSTER tone til mere formel stil
- "Fokusér på X emne" → OMSTRUKTURÉR indlægget til at handle primært om X

Dit job er at BEVARE essensen af det originale indlæg, men tilpasse det FULDSTÆNDIGT efter brugerens feedback.
` : `
⚠️ VIGTIGT: Disse krav skal integreres naturligt i indlægget og opfylder brugerens specifikke ønsker.
Hvis brugerens krav konflikter med standardinstruktioner nedenfor, FØLG ALTID brugerens krav.
`}
` : '';

    return `
${worldviewContext}

${postTypeInstructions}

${adaptiveContext ? `### ADAPTIV KONTEKST FRA SYSTEMETS HUKOMMELSE ###\n${adaptiveContext}\n` : ''}

${userRequirements}

### NEGATIVE BEGRÆNSNINGER ###
${negativeConstraints}

### STANDARD KRAV (kan tilsidesættes af brugerens feedback) ###
- Skriv hele indlægget på ${targetLanguage}
- Opret substantielt indhold (typisk minimum 200 ord) - medmindre brugeren ønsker kortere
- Gør hvert indlæg UNIKT og FORSKELLIGT fra andre
- Inkluder specifikke eksempler, historier eller detaljerede indsigter
- Brug autentisk, personlig stemme - undgå corporate jargon
- INGEN emojis - fokusér på substans over visuelle effekter
- INGEN hashtags - indholdet skal være så værdifuldt at det kan stå alene
- Afslut med en overbevisende call-to-action der opfordrer til ægte engagement
- Gør det til at føles som om det kommer fra en med reel ekspertise og erfaring

${qualityControl}

VIGTIGT: Formatér svaret som gyldigt JSON kun. Inkluder ikke tekst før eller efter JSON'en. Escape alle anførselstegn og linjeskift korrekt.

{
  "content": "Indlægets hovedindhold på ${targetLanguage} (escape anførselstegn med \\\" og linjeskift med \\n)",
  "hashtags": []
}

${isImprovingExisting ? 
`🔴 HUSK: Du forbedrer et eksisterende indlæg baseret på brugerens feedback. 
BEVAR kernbudskabet og essensen, men TILPAS FULDSTÆNDIGT efter brugerens specifikke ønsker.
Brugerens feedback går forud for ALLE standardregler ovenfor.` 
: 
'Husk: Skab indhold der leverer ægte værdi og føles autentisk. Gør det detaljeret og engagerende som en thought leader ville skrive.'
} Returnér KUN JSON-objektet, ingen yderligere tekst.
`;
  }

  // Build adaptive memory context from feedbacks and published posts
  async buildAdaptiveContext(entityType, entityId, limit = 10) {
    try {
      const parts = [];

      // Recent approved/published posts
      const { data: published, error: pubErr } = await supabase
        .from('posts')
        .select('content, hashtags, posted_date')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('status', 'posted')
        .order('posted_date', { ascending: false })
        .limit(limit);
      if (!pubErr && published && published.length > 0) {
        parts.push(`TIDLIGERE GODKENDTE/UDGIVNE INDLÆG (seneste ${published.length}):`);
        published.forEach((p, idx) => {
          parts.push(`- [${idx + 1}] ${p.content.substring(0, 600)}${p.content.length > 600 ? '...' : ''}`);
        });
      }

      // Feedback memory
      const { data: feedbacks, error: fbErr } = await supabase
        .from('post_feedback')
        .select('feedback, created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!fbErr && feedbacks && feedbacks.length > 0) {
        parts.push(`BRUGERENS FEEDBACK (seneste ${feedbacks.length}):`);
        feedbacks.forEach((f, idx) => parts.push(`- [${idx + 1}] ${f.feedback}`));
        parts.push('ANVEND FEEDBACKEN SOM STILGUIDE OG PRÆFERENCEKOMPAS.');
      }

      return parts.join('\n');
    } catch (e) {
      logger.warn('Failed building adaptive context', e);
      return '';
    }
  }

  parsePostResponse(postContent, language = 'da') {
    try {
      // Clean the response first
      let cleanedContent = postContent.trim();
      
      // Remove any text before the first { and after the last }
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        throw new Error('No valid JSON structure found in response');
      }
      
      cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
      
      // Remove control characters and normalize line endings
      cleanedContent = cleanedContent
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n')
        .replace(/\n/g, '\\n') // Escape newlines for JSON
        .replace(/\t/g, '\\t') // Escape tabs
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"/g, '\\"'); // Escape quotes
      
      // Try to reconstruct valid JSON
      let post;
      try {
        // Try to parse the cleaned content
        post = JSON.parse(cleanedContent);
      } catch (parseError) {
        // If still failing, try manual extraction
        const originalContent = postContent;
        const contentMatch = originalContent.match(/"content":\s*"([^"]*(?:\\.[^"]*)*)"/);
        const hashtagsMatch = originalContent.match(/"hashtags":\s*\[([^\]]*)\]/);
        
        if (contentMatch) {
          post = {
            content: contentMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\'),
            hashtags: hashtagsMatch ? 
              hashtagsMatch[1]
                .split(',')
                .map(tag => tag.trim().replace(/"/g, '').replace(/\\/g, ''))
                .filter(tag => tag.length > 0) : []
          };
        } else {
          throw parseError;
        }
      }
      
      // Validate required fields
      if (!post.content || typeof post.content !== 'string') {
        throw new Error('Missing or invalid content field');
      }
      
      // Ensure hashtags is an array
      if (!Array.isArray(post.hashtags)) {
        post.hashtags = [];
      }
      
      // Clean up content
      post.content = post.content.trim();
      
      return post;
    } catch (error) {
      logger.error('Error parsing post response:', error);
      
      // Return a fallback post in the specified language
      const fallbackPosts = {
        'da': {
          content: "Deler indsigter fra min erfaring i branchen. Hvilke udfordringer står du overfor i dit felt?",
          hashtags: ["#professionel", "#indsigter", "#netværk"]
        },
        'en': {
          content: "Sharing insights from my experience in the industry. What challenges are you facing in your field?",
          hashtags: ["#professional", "#insights", "#networking"]
        },
        'no': {
          content: "Deler innsikter fra min erfaring i bransjen. Hvilke utfordringer står du overfor i ditt felt?",
          hashtags: ["#profesjonell", "#innsikt", "#nettverk"]
        },
        'sv': {
          content: "Delar insikter från min erfarenhet i branschen. Vilka utmaningar står du inför i ditt område?",
          hashtags: ["#professionell", "#insikter", "#nätverk"]
        }
      };
      
      return fallbackPosts[language] || fallbackPosts['da'];
    }
  }

  async generateMultiplePosts(entity, strategy, count = 3, requirements = '') {
    try {
      // Generate 3 posts with different advanced styles including new post types
      const postTypes = ['educational', 'personal_story', 'industry_insight'];
      
      // Generate all posts in parallel for much faster execution
      const postPromises = postTypes.map(async (postType, index) => {
        const post = await this.generatePost(entity, strategy, postType, index + 1, requirements);
        return {
          ...post,
          post_type: postType,
          generated_at: new Date().toISOString()
        };
      });
      
      // Wait for all posts to be generated
      const posts = await Promise.all(postPromises);
      
      logger.info(`Successfully generated ${posts.length} posts with types: ${posts.map(p => p.post_type).join(', ')}`);
      
      return posts;
    } catch (error) {
      logger.error('Error generating multiple posts:', error);
      throw error;
    }
  }
}

module.exports = new PostGenerator();
