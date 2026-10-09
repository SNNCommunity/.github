# Organization setup tasks requiring GitHub web administration

The existing GitHub ChatGPT connection can create and update **files** in repositories it is authorized to access, but its exposed actions do **not** currently create a repository, update organization profile details, upload organization avatars, or configure organization-wide Discussions.

The steps below must be performed in the GitHub user interface by an organization owner. They do **not** require migrating or modifying any personal GitHub account.

## A. Public organization profile

Open [SNNCommunity organization settings](https://github.com/organizations/SNNCommunity/settings/profile) (or Organization → Settings → Public profile).

Suggested display values:

- **Name:** SNN Community
- **Description:** An open community for spiking neural networks, neuromorphic computing, and embodied intelligence.
- **Website:** leave blank until there is a working, maintained destination.
- **Location:** leave blank; this is an international, independent community.
- **Contact email:** leave blank until a dedicated maintained contact address exists.
- **Avatar:** use a community-owned logo; do not use an unauthorised university emblem.

Do not imply endorsement by UCLA, any specific institution, framework, or hardware vendor.

## B. Repository information

On [the .github repository](https://github.com/SNNCommunity/.github), edit the **About** section (gear icon) and use:

- **Description:** Organization profile, community guidelines, and contribution templates for SNNCommunity.
- **Topics:** `spiking-neural-networks`, `snn`, `neuromorphic-computing`, `open-science`.

These repository settings are **different** from the organization public profile.

## C. Security review

In Organization Settings, review base repository permissions, ability to create/delete/transfer repos, owners, authentication requirements, and the GitHub App's repository scope. Prefer narrow access for third-party apps and untrusted contributors.

For repositories containing executable code, configure branch protection/rulesets and private vulnerability reporting where supported. Do not put privileged runners, secrets, or private research datasets in untrusted PR workflows.

## D. Create the community repository

1. Go to [New repository](https://github.com/new?owner=SNNCommunity).
2. Owner: **SNNCommunity**. Name: **community**. Visibility: **Public**.
3. Initialize with README and create.
4. If the connector uses selected repositories, include `community` in its installation settings.
5. In the organization's GitHub Settings, enable organization discussions and choose `community` as the source repository, if offered in the current GitHub UI.
6. Publish a welcome discussion and link it from the organization profile.

## E. Create the resources repository

Repeat with **snn-resources**, Public, initialized with README, and authorize it to the GitHub connector if using selected-repository scope.

Once these repositories exist and are accessible, their contents can be developed and reviewed through the authorized GitHub connection.

## F. Verification

Check the live [organization homepage](https://github.com/SNNCommunity), [community-health repository](https://github.com/SNNCommunity/.github), visible Discussions links, member roles, and public contribution flows in a signed-out browser window. Update [ROADMAP.md](ROADMAP.md) to reflect verified progress.
