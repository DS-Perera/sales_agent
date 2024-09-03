const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const searchQuery = "Salons in Colombo contact Email list";
  const url = `https://www.google.com/search?q=${encodeURIComponent(
    searchQuery
  )}`;

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Wait for search results to load
  await page.waitForSelector("h3");

  const results = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll("div.g").forEach((element) => {
      const titleElement = element.querySelector("h3");
      const linkElement = element.querySelector("a");
      const snippetElement = element.querySelector(".aCOpRe");

      if (titleElement && linkElement) {
        const title = titleElement.innerText;
        const url = linkElement.href;
        const snippet = snippetElement ? snippetElement.innerText : "";

        items.push({ title, url, snippet });
      }
    });
    return items;
  });

  console.log("Search Results:");
  console.log(results);

  // Function to extract contact information (emails, phone numbers, and mobile numbers) from a page
  const extractContactInfo = async (url) => {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // Extract emails, phone numbers, and mobile numbers from targeted page sections
      const contactInfo = await page.evaluate(() => {
        // Optimized regex for matching general phone numbers
        const phoneRegex =
          /\+?\(?\d{1,4}\)?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
        // Regex for matching mobile numbers (this pattern may need to be adjusted based on local conventions)
        const mobileRegex =
          /\b(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?((7|8|9)\d{9})\b/g;
        const emailRegex =
          /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

        // Extract contact details from specific areas like footer, headers, contact sections
        const contactElements = document.querySelectorAll("body, header, footer, a, p");
        const textContent = Array.from(contactElements).map((el) => el.innerText).join(" ");

        const emails = textContent.match(emailRegex) || [];
        const phoneNumbers = textContent.match(phoneRegex) || [];
        const mobileNumbers = textContent.match(mobileRegex) || [];

        return { emails, phoneNumbers, mobileNumbers };
      });

      return contactInfo;
    } catch (error) {
      console.error(`Error extracting contact information from ${url}:`, error.message);
      return { emails: [], phoneNumbers: [], mobileNumbers: [] };
    }
  };

  for (const result of results) {
    console.log(`Visiting: ${result.url}`);
    const contactInfo = await extractContactInfo(result.url);
    if (contactInfo.emails.length > 0) {
      result.emails = contactInfo.emails;
    }
    if (contactInfo.phoneNumbers.length > 0) {
      result.phoneNumbers = contactInfo.phoneNumbers;
    }
    if (contactInfo.mobileNumbers.length > 0) {
      result.mobileNumbers = contactInfo.mobileNumbers;
    }
  }

  console.log("Results with Contact Information:");
  console.log(results);

  await browser.close();
})();
