import React from "react";

export function CoinStory({ coin, expanded, onToggle }) {
  if (!coin?.story) return null;

  const long = coin.story.length > 120;
  const text = expanded || !long ? coin.story : `${coin.story.slice(0, 120)}...`;

  return (
    <div className="coinStory">
      <div className="coinStoryHead">
        <div className="coinStoryIcon" aria-hidden="true">
          📖
        </div>
        <div>
          <div className="coinStoryTitle">About {coin.name}</div>
          <div className="coinStorySub">{coin.symbol} • Story</div>
        </div>
      </div>

      <div className="coinStoryBody">
        {text}
        {long ? (
          <span
            role="button"
            tabIndex={0}
            className="coinStoryToggle"
            onClick={onToggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle?.();
              }
            }}
          >
            {expanded ? "Less" : "Read More"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
