const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const searchQuery = "redhat service provider in sri lanka contact email list";
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
        const phoneRegex =
          /\+?\(?\d{1,4}\)?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
        const mobileRegex =
          /\b(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?((7|8|9)\d{9})\b/g;
        const emailRegex =
          /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

        const contactElements = document.querySelectorAll("body, header, footer, a, p");
        const textContent = Array.from(contactElements).map((el) => el.innerText).join(" ");

        const emails = textContent.match(emailRegex) || [];

        let phoneNumbers = textContent.match(phoneRegex) || [];
        phoneNumbers = phoneNumbers
          .map(number => number.replace(/\D/g, ''))  // Remove non-digit characters
          .filter(number => number.length >= 9);     // Filter numbers with at least 9 digits
        phoneNumbers = [...new Set(phoneNumbers)];   // Remove duplicates

        let mobileNumbers = textContent.match(mobileRegex) || [];
        mobileNumbers = mobileNumbers
          .map(number => number.replace(/\D/g, ''))  // Remove non-digit characters
          .filter(number => number.length >= 9);     // Filter numbers with at least 9 digits
        mobileNumbers = [...new Set(mobileNumbers)]; // Remove duplicates

        return { emails, phoneNumbers, mobileNumbers };
      });

      return contactInfo;
    } catch (error) {
      console.error(`Error extracting contact information from ${url}:`, error.message);
      return { emails: [], phoneNumbers: [], mobileNumbers: [] };
    }
  };

  // Function to extract a summary of the company
  const extractCompanySummary = async (url) => {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const summary = await page.evaluate(() => {
        const metaDescription = document.querySelector("meta[name='description']");
        const description = metaDescription ? metaDescription.getAttribute('content') : '';

        if (description) {
          return description;
        }

        const mainContent = document.querySelector('body');
        if (mainContent) {
          return mainContent.innerText.slice(0, 300) + '...'; // Return the first 300 characters
        }

        return "No summary available.";
      });

      return summary;
    } catch (error) {
      console.error(`Error extracting company summary from ${url}:`, error.message);
      return "No summary available.";
    }
  };

  // Function to extract the company logo link
  const extractCompanyLogo = async (url) => {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const logoUrl = await page.evaluate(() => {
        // Common logo selectors
        const logoSelectors = [
          'img[alt*="logo"]',
          'img[src*="logo"]',
          'link[rel*="icon"]',
          'link[rel*="shortcut icon"]'
        ];

        for (const selector of logoSelectors) {
          const logoElement = document.querySelector(selector);
          if (logoElement) {
            return logoElement.src || logoElement.href;
          }
        }

        return null;
      });

      return logoUrl || "Logo not found.";
    } catch (error) {
      console.error(`Error extracting company logo from ${url}:`, error.message);
      return "Logo not found.";
    }
  };

  // Function to select a specific contact number (must be a mobile number)
  const selectSpecificContactNumber = (mobileNumbers) => {
    if (mobileNumbers.length > 0) {
      return mobileNumbers[0];
    }
    return null;
  };

  for (const result of results) {
    console.log(`Visiting: ${result.url}`);

    // Extract contact information
    const contactInfo = await extractContactInfo(result.url);
    if (contactInfo.emails.length > 0) {
      result.emails = contactInfo.emails;
    }
    if (contactInfo.phoneNumbers.length > 0) {
      result.phoneNumbers = contactInfo.phoneNumbers;
    }
    if (contactInfo.mobileNumbers.length > 0) {
      result.mobileNumbers = contactInfo.mobileNumbers;
      // Select a specific mobile number
      result.selectedMobileNumber = selectSpecificContactNumber(contactInfo.mobileNumbers);
    }

    // Extract company summary
    const companySummary = await extractCompanySummary(result.url);
    result.companySummary = companySummary;

    // Extract company logo
    const logoUrl = await extractCompanyLogo(result.url);
    result.logoUrl = logoUrl;
  }

  console.log("Results with Contact Information, Company Summary, and Logo URL:");
  console.log(results);

  await browser.close();
})();
