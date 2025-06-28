export const metadata = {
  title: 'Terms of Service - TheYarnZoo',
  description: 'Read the Terms of Service for using TheYarnZoo website and purchasing products.',
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 prose prose-lg max-w-4xl">
      <h1>Terms of Service</h1>
      <p className="lead">Welcome to TheYarnZoo! These terms and conditions outline the rules and regulations for the use of TheYarnZoo's Website, located at [YourWebsiteURL.com].</p>

      <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use TheYarnZoo if you do not agree to take all of the terms and conditions stated on this page.</p>

      <h2>1. Definitions</h2>
      <p>The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company’s terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties", or "Us", refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client’s needs in respect of provision of the Company’s stated services, in accordance with and subject to, prevailing law of [Your Jurisdiction]. Any use of the above terminology or other words in the singular, plural, capitalization and/or he/she or they, are taken as interchangeable and therefore as referring to same.</p>

      <h2>2. Cookies</h2>
      <p>We employ the use of cookies. By accessing TheYarnZoo, you agreed to use cookies in agreement with the TheYarnZoo's Privacy Policy.</p>
      <p>Most interactive websites use cookies to let us retrieve the user’s details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.</p>

      <h2>3. License</h2>
      <p>Unless otherwise stated, TheYarnZoo and/or its licensors own the intellectual property rights for all material on TheYarnZoo. All intellectual property rights are reserved. You may access this from TheYarnZoo for your own personal use subjected to restrictions set in these terms and conditions.</p>
      <p>You must not:</p>
      <ul>
        <li>Republish material from TheYarnZoo</li>
        <li>Sell, rent or sub-license material from TheYarnZoo</li>
        <li>Reproduce, duplicate or copy material from TheYarnZoo</li>
        <li>Redistribute content from TheYarnZoo</li>
      </ul>

      <h2>4. Product Information and Purchases</h2>
      <p>We strive to ensure that all details, descriptions, images and prices of products appearing on the Website are accurate. However, errors may occur. If we discover an error in the price of any goods which you have ordered we will inform you of this as soon as possible and give you the option of reconfirming your order at the correct price or cancelling it.</p>
      <p>All orders are subject to availability and confirmation of the order price.</p>

      <h2>5. User Reviews</h2>
      <p>Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. TheYarnZoo does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of TheYarnZoo, its agents and/or affiliates. Comments reflect the views and opinions of the person who post their views and opinions.</p>
      <p>TheYarnZoo reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive or causes breach of these Terms and Conditions.</p>

      <h2>6. Governing Law</h2>
      <p>These terms and conditions are governed by and construed in accordance with the laws of [Your Jurisdiction] and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>

      <h2>7. Changes to Terms</h2>
      <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

      <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
    </div>
  );
}
