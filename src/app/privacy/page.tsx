export const metadata = {
  title: 'Privacy Policy - TheYarnZoo',
  description: 'Read the Privacy Policy for TheYarnZoo to understand how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 prose prose-lg max-w-4xl">
      <h1>Privacy Policy</h1>
      <p className="lead">Your privacy is important to us. It is TheYarnZoo's policy to respect your privacy regarding any information we may collect from you across our website, [YourWebsiteURL.com], and other sites we own and operate.</p>

      <h2>1. Information We Collect</h2>
      <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
      <p>Information we may collect includes:</p>
      <ul>
        <li>Contact Information (such as name, email address, mailing address, phone number)</li>
        <li>Payment Information (such as credit card details, billing address - processed by third-party payment gateways like Razorpay)</li>
        <li>Order Information (details of products you purchase)</li>
        <li>Account Information (if you create an account, such as username and password)</li>
        <li>Communication Information (records of your correspondence with us)</li>
        <li>Usage Information (how you interact with our website, IP address, browser type)</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect in various ways, including to:</p>
      <ul>
        <li>Provide, operate, and maintain our website</li>
        <li>Improve, personalize, and expand our website</li>
        <li>Understand and analyze how you use our website</li>
        <li>Develop new products, services, features, and functionality</li>
        <li>Process your transactions and manage your orders</li>
        <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
        <li>Send you emails</li>
        <li>Find and prevent fraud</li>
      </ul>

      <h2>3. Log Files</h2>
      <p>TheYarnZoo follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>
      
      <h2>4. Cookies and Web Beacons</h2>
      <p>Like any other website, TheYarnZoo uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>

      <h2>5. Third-Party Privacy Policies</h2>
      <p>TheYarnZoo's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.</p>
      <p>For example, if we use Razorpay for payment processing, their privacy policy would apply to the payment information you provide them.</p>

      <h2>6. Data Security</h2>
      <p>We take reasonable precautions to protect your information. When you submit sensitive information via the website, your information is protected both online and offline. However, no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.</p>

      <h2>7. Your Data Protection Rights</h2>
      <p>Depending on your location, you may have the following rights regarding your personal information:</p>
      <ul>
        <li>The right to access – You have the right to request copies of your personal data.</li>
        <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
        <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
        <li>The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
        <li>The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.</li>
        <li>The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
      </ul>
      <p>If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.</p>

      <h2>8. Children's Information</h2>
      <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.</p>
      <p>TheYarnZoo does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.</p>
      
      <h2>9. Changes to This Privacy Policy</h2>
      <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

      <h2>10. Contact Us</h2>
      <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at [contact@yourwebsiteurl.com].</p>

      <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
    </div>
  );
}
