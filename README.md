## Interactive room preview

The homepage routes desktop visitors to `/room/` and mobile visitors directly to the classic resume. The doorbell opens `/classic/zh/` or `/classic/en/`, preserving the particle pages. It includes a shared indoor/outdoor house, soft furnishings, plants, and an editable character. See [room-app/README.md](room-app/README.md) for local preview commands, controls, and validation.

To publish, select **Settings → Pages → Source → GitHub Actions** and push to `main`. The **Deploy homepage** workflow builds the room assets before Jekyll and deploys the complete `_site/`. The default branch-based Jekyll builder cannot build the room. Generated assets remain ignored; commit the source and workflow files.

## How to config?

**Windows + WSL**

```bash
sudo apt update
sudo apt install ruby-full build-essential zlib1g-dev
```

gems.sh (for path configuration)

```bash
export GEM_HOME="$HOME/gems
export PATH="$HOME/gems/bin:$PATH
```

**macOS**

```zsh
brew install ruby@3.3
```

gems.sh

```zsh
export PATH="/usr/local/lib/ruby/gems/3.3.0/bin:$PATH"
```

**Install Jekyll and Bundler**

```bash
source gems.sh
gem install jekyll bundler
```

**Initial gems**:

Gemfile

```bash
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
```

**Start Server**

```bash
cd Cynthia532.github.io
bundle install
bundle exec jekyll serve
```
