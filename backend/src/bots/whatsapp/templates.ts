export const templates = {
  welcome: `🤖 *Welcome to Litmus AI Fact-Checker!*

To fact-check any content, start your message with:
*/litmus* followed by your text or news article link

📝 *Examples:*
/litmus Bitcoin will reach $100k by 2025
/litmus https://timesofindia.indiatimes.com/business/india-business/india-to-become-worlds-3rd-largest-economy-by-2030/articleshow/98765432.cms

📋 *Commands:*
• */help* - Show this guide

Ready to fact-check? Just type */litmus* and your claim or news link! 🔍`,

  help: `📖 *Litmus AI Help*

*How to use:*
Type */litmus* followed by any claim, text, or news article link

*Examples:*
• */litmus Earth is flat*
• */litmus Coffee causes dehydration*
• */litmus Vaccines contain microchips*
• */litmus https://timesofindia.indiatimes.com/world/us/us-scientists-discover-cure-for-cancer/articleshow/12345678.cms*

Need help? Just ask! 🤖`,

  noContent: `Please provide content to fact-check after \`/litmus\`

*Examples:* 
• \`/litmus The Great Wall of China is visible from space\`
• \`/litmus https://timesofindia.indiatimes.com/business/economy/finance/rupee-hits-all-time-high/articleshow/87654321.cms\``,

  analyzing: (content: string) => `🔍 *Starting Analysis*

📝 *Analyzing:* "${
    content.length > 60 ? content.substring(0, 60) + "..." : content
  }"

⏱️ *Please wait while we process your request...*`,

  completed: (
    title: string,
    description: string,
    credibility: number,
    sources?: string[]
  ) => {
    let message = `✅ *Fact-Check Complete*

📋 *${title}*

${description}

🎯 *Credibility Score:* ${credibility}%`;

    if (sources && sources.length > 0) {
      message += `\n\n🔗 *Sources:*`;
      sources.slice(0, 3).forEach((url, i) => {
        message += `\n${i + 1}. ${url}`;
      });
    }

    message += `\n\n💬 Want to fact-check something else? Just type */litmus [your claim or news link]*`;
    return message;
  },

  failed: (error: string) => `❌ *Analysis Failed*

Sorry, I couldn't complete the analysis.
*Error:* ${error}

Please try again with different content.`,

  error: `❌ *Oops! Something went wrong*

I'm experiencing technical difficulties. Please try again in a few moments.`,
};
