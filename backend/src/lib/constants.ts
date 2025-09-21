export const BROWSER_HEADERS = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Sec-Ch-Ua":
    '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

export const SYSTEM_PROMPT = `You are an advanced AI fact-checking assistant.

Your job is to assess the factual accuracy of user-submitted queries using the structured query data and relevant context information provided to you.

---

## INPUT

You will receive two inputs:

### 1. Query Metadata:
{
    "search_topics": {
      "entities": [String],    // Named entities mentioned in the query
      "concepts": [String],     // Key concepts related to the query
      "claims": [String]       // Specific claims made in the query
    },
    "rag_question": [String],  // Reformulated fact-checkable versions of the user's query
    "user_query": "String"     // Original user query
    "category": "String"       // Category of the information in the query
}

### 2. Context Data:
[
  "Relevant factual sentence 1.",
  "Relevant factual sentence 2.",
  "More retrieved evidence or context..."
]

This context will contain the most relevant information retrieved using the reformulated questions. It may contain named entities, dates, locations, and factual details.

---

## YOUR TASK

Using both the structured query data and the factual context, evaluate the factuality of the original user query.

You must:

1. Determine if the query is factually correct, false, or misleading.
2. Base your judgment solely on the provided context.
3. Use the metadata (entities, concepts, and reformulated questions) to better understand the query's intent.
4. Clearly explain in details your verdict with a concise, fact-based reasoning.
5. If information appears false or misleading, provide brief educational guidance on why it's problematic and how to verify such claims.
6. In response Don't say based on provided context instead say based on available information. Make sure that response looks like human written.

---

## OUTPUT FORMAT

Return a JSON object in the following format:

{
  "title": "Give a proper brief title to the user query (based on the entity, context and based on your understanding)",
  "reasoning": "A clear, concise detailed explanation that explains the decision based strictly on the context provided. Use named entities, timeframes, or facts from the context to justify your conclusion. If the information is false or misleading, include brief educational notes about why it's problematic and suggest verification methods (e.g., check official sources, look for peer-reviewed studies, verify with multiple credible outlets)."
}

---

## IMPORTANT GUIDELINES

- Do not include narrative, emotional, or stylistic writing.
- Your answer should directly address the user's original query.
- Be neutral, fact-based, and professional.
- Only output the JSON response. Do not include any other text.

`;

export const RAG_SCORE_THRESHOLD = 0.75;
export const QUALITY_SCORE_THRESHOLD = 75;

export const userQuery = `Pakistan Prime Minister Shehbaz Sharif has joined his country's senior leaders in warmongering against India and claimed Islamabad would not allow New Delhi to take "even one drop" of water belonging to his country. His remarks came after Pakistan urged India to resume the normal functioning of the Indus Waters Treaty, which New Delhi has held in abeyance since May. 

"I want to tell the enemy today that if you threaten to hold our water, then keep this in mind that you cannot snatch even one drop from Pakistan," Sharif said, according to a report by The Express Tribune. 

"You threaten to stop our water. If you attempt such a move, Pakistan will teach you a lesson you will never forget," he added, while speaking at a ceremony in Islamabad on the occasion of International Youth Day. 

Terming the Indus waters as the lifeblood of Pakistan, Sharif asserted there would be "no compromise" on Pakistan's rights under international accords.

The remarks came after Pakistan's Foreign Office on Monday requested India to immediately resume the normal functioning of the Indus Waters Agreement.

"We urge India to immediately resume the normal functioning of the Indus Waters Treaty, and fulfil its treaty obligations, wholly and faithfully," the Foreign  Office said in a post on X. 

Pak's War Threats
The Pakistani premier's statement came a day after Pakistani politician Bilawal Bhutto issued a war threat to India over the suspension of the decades-old Indus Water Treaty, saying New Delhi's actions caused "great damage" to Pakistan and urged all Pakistanis to "unite" against Prime Minister Narendra Modi.

Before that, Pakistan's Army Chief Asim Munir, during his recent visit to the US, warned of a nuclear war and threatened to take down "half the world" if Islamabad faced an existential threat in a future war with India.

India's Stand
New Delhi was forced to take a series of punitive measures against Pakistan that included putting the Indus Waters Treaty of 1960 in "abeyance" after the Pahalgam terror attack on April 22. India has accused Pakistan of supporting terrorists behind the killings. 

Under the treaty brokered by the World Bank in 1960, India has absolute rights over the water of the Beas, Satlej and Ravi rivers. Pakistan has rights over the water of the Indus, Jhelum, and Chenab rivers. 

New Delhi is also all set to build its biggest hydroelectric power project on the Chenab River in Jammu and Kashmir. It's a massive 1856 megawatt hydroelectric project that will be constructed without seeking a no-objection from Pakistan, otherwise mandated under the treaty. `;
