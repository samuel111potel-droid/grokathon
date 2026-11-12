export function Legend() {
  return (
    <aside className="legend" aria-label="Community layer legend">
      <h2>Legend</h2>
      <ul>
        <li>
          <span className="swatch home" aria-hidden /> Homes
        </li>
        <li>
          <span className="swatch school" aria-hidden /> Schools
        </li>
        <li>
          <span className="swatch worship" aria-hidden /> Places of worship
        </li>
        <li>
          <span className="swatch ring" aria-hidden /> 150 m / 300 m rings
        </li>
        <li>
          <span className="swatch hall" aria-hidden /> Halls
        </li>
        <li>
          <span className="swatch generator" aria-hidden /> Generators
        </li>
        <li>
          <span className="swatch refused" aria-hidden /> Planning refused
        </li>
        <li>
          <span className="swatch conditions" aria-hidden /> Approved with conditions
        </li>
        <li>
          <span className="swatch approved" aria-hidden /> Planning approved
        </li>
        <li>
          <span className="swatch site" aria-hidden /> Site boundary
        </li>
      </ul>
    </aside>
  );
}
