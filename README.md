# macguider-resize

Serverless function of resizing image for [Macguider](https://macguider.io)

- Provided as Lambda@Edge of existing cloudfront distribution, triggered by image request and respond with resized image

## Execution Guides

### Environment Configuration

Configuration by environment variable should be done before running the app.

- At:
  - `env.prod.json` or `.env.dev.json` file
- About:
  - `LAMBDA_ROLE_ARN`: ARN of existing Lambda role consisting of required authority
  - `CLOUDFRONT_DISTRIBUTION_ID`: ID of Cloudfront distribution to apply resizing
  - `S3_BUCKET`: Name of S3 bucket of target images

#### Example configuration

```
{
  "LAMBDA_ROLE_ARN": "arn:aws:iam::xxxxxxxxxxxx:role/xxxxxxxx",
  "CLOUDFRONT_DISTRIBUTION_ID": "xxxxxxxxxxxx",
  "S3_BUCKET": "xxxxxxxxxxxx",
}
```

### Installation

```bash
$ npm install
```

### Execution

#### Local Serve

```bash
$ npm run offline
```

#### Production Deployment

```bash
$ npm run deploy
```

## Contribution Rules

### Commit Convention

```
type(scope): Subject

body

footer
```

#### Commit Type

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Changes to documentation
- `style`: Formatting, missing semi colons, etc; no code change
- `refactor`: Refactoring production code
- `test`: Adding tests, refactoring test; no production code change
- `chore`: Updating build tasks, package manager configs, etc; no production code change

If you think a new commit type is needed, you can contribute by changing `commitlint.config.js` and this paragraph.

### Branching Strategy

- `master`: branch to manage only stable states deployed to product
- `develop`: branch to integrate features to be deployed (development is mainly based on this branch)
- `feature`: branch to develop new features
- `hotfix`: branch to correct urgent issues

#### Branch Flows

- branch `feature` from `develop` -> develop features in `feature` -> pull request to `develop` -> approve and merge to `develop`
- `develop` become distributable -> merge `develop` to `master`, deploy `master` to product, add a version tag to `master`
- branch `hotfix` from `master` -> fix issues in `hotfix` -> pull request to `master` -> approve and merge to `master` and `develop`

#### Branch Naming Convention

`feature/swm-issue#`

ex) `feature/swm-123`
