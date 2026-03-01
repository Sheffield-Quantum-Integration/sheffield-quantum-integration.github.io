# sheffield-quantum-integration
Website

## Custom domain without moving to a CMS

This site can stay on GitHub Pages while using a university subdomain.

1. Ask IT to create a DNS CNAME (for example `quantumlab.sheffield.ac.uk`) pointing to:
   `sheffield-quantum-integration.github.io`
2. Add a `public/CNAME` file in this repo containing only the custom hostname.
3. In GitHub Pages settings, set the same custom domain and enable HTTPS.
4. Update canonical URL references and `public/sitemap.xml` to the custom hostname.

This keeps deployment in GitHub while only delegating DNS at the university side.
