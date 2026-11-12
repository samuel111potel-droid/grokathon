interface Props {
  onScreen: number;
  withSource: number;
  assumptionOrComputed: number;
}

export function FiguresFooter({
  onScreen,
  withSource,
  assumptionOrComputed,
}: Props) {
  return (
    <footer className="figures-footer" data-testid="figures-footer">
      <span>
        <strong>{onScreen}</strong> figures on screen
      </span>
      <span>
        <strong>{withSource}</strong> figures with a source
      </span>
      <span>
        <strong>{assumptionOrComputed}</strong> figures marked assumption or computed
      </span>
    </footer>
  );
}
