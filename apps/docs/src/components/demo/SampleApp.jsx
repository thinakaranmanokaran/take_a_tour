/**
 * The sample application the tours run over.
 *
 * This is demo-only interface code, fully separate from the library: a
 * realistic panel with a sidebar, heading, primary action, search control,
 * metric cards and a table (or a form on the invite variant). Every tour
 * target carries a `data-tour-id`, and the identifiers are literal values
 * namespaced by `prefix` so several panels can coexist on one page.
 */

export function sampleTargets(prefix) {
  return {
    nav: `${prefix}.nav`,
    title: `${prefix}.title`,
    search: `${prefix}.search`,
    create: `${prefix}.create`,
    metrics: `${prefix}.metrics`,
    table: `${prefix}.table`,
    email: `${prefix}.form.email`,
    role: `${prefix}.form.role`,
    invite: `${prefix}.form.invite`,
  };
}

function PrimaryAction({ target, onCreate, children }) {
  if (!onCreate) {
    return (
      <span className="demo-btn demo-btn--primary" data-tour-id={target} aria-hidden="true">
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="demo-btn demo-btn--primary"
      data-tour-id={target}
      onClick={onCreate}
    >
      {children}
    </button>
  );
}

export default function SampleApp({
  prefix,
  variant = "dashboard",
  onCreate,
  url = "app.example.com/overview",
}) {
  const targets = sampleTargets(prefix);

  return (
    <div className="demo-frame">
      <div className="demo-frame__chrome">
        <span className="demo-frame__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="demo-frame__url">{url}</span>
      </div>

      <div className="demo-frame__body">
        <aside
          className="demo-sidebar"
          data-tour-id={targets.nav}
          aria-label="Sample app navigation"
        >
          <span className="demo-sidebar__brand">Acme Analytics</span>
          <span className="demo-nav__item demo-nav__item--active">Overview</span>
          <span className="demo-nav__item">Reports</span>
          <span className="demo-nav__item">Audience</span>
          <span className="demo-nav__item">Settings</span>
        </aside>

        <div className="demo-main">
          {variant === "form" ? (
            <>
              <p className="demo-heading" data-tour-id={targets.title}>
                Invite a teammate
              </p>
              <p className="demo-note">
                They will receive an email with a link to join this workspace.
              </p>
              <div className="demo-form">
                <label className="demo-field" data-tour-id={targets.email}>
                  <span>Work email</span>
                  <input type="email" placeholder="teammate@acme.com" />
                </label>
                <label className="demo-field" data-tour-id={targets.role}>
                  <span>Role</span>
                  <select defaultValue="editor">
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <div>
                  <PrimaryAction target={targets.invite} onCreate={onCreate}>
                    Send invite
                  </PrimaryAction>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="demo-topbar">
                <p className="demo-heading" data-tour-id={targets.title}>
                  Overview
                </p>
                <div className="demo-actions">
                  <span className="demo-search" data-tour-id={targets.search}>
                    Search projects…
                  </span>
                  <PrimaryAction target={targets.create} onCreate={onCreate}>
                    Create project
                  </PrimaryAction>
                </div>
              </div>

              <div className="demo-metrics" data-tour-id={targets.metrics}>
                <div className="demo-metric">
                  <strong>12,480</strong>
                  <span>Visitors</span>
                </div>
                <div className="demo-metric">
                  <strong>3.4%</strong>
                  <span>Conversion</span>
                </div>
                <div className="demo-metric">
                  <strong>$21.9k</strong>
                  <span>MRR</span>
                </div>
              </div>

              <div className="demo-table" data-tour-id={targets.table}>
                <div className="demo-table__row demo-table__row--head">
                  <span>Project</span>
                  <span>Plan</span>
                  <span>MRR</span>
                </div>
                <div className="demo-table__row">
                  <span>Website</span>
                  <span>Scale</span>
                  <span>$1,240</span>
                </div>
                <div className="demo-table__row">
                  <span>Mobile app</span>
                  <span>Growth</span>
                  <span>$860</span>
                </div>
                <div className="demo-table__row">
                  <span>Public API</span>
                  <span>Hobby</span>
                  <span>$0</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
