import type { BskyAgent } from "@atproto/api";
import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import React from "react";
import clsx from "clsx";

interface Props {
  follower: ProfileViewDetailed;
  ratio: number;
  agent: BskyAgent;
}

export default function (props: Props) {
  const { follower, ratio, agent } = props;
  const [mutuals, setMutuals] = React.useState(!!follower.viewer?.following);
  const [loading, setLoading] = React.useState(false);

  return (
    <div
      className={clsx(
        "flex items-center p-4 gap-4 relative max-w-[600px] border rounded-lg",
        {
          "bg-red-500": ratio < 1,
          "opacity-70 bg-gray-100": mutuals,
        }
      )}
    >
      <div>
        <img
          src={follower.avatar}
          className="max-w-[100px] aspect-square rounded-md"
        />
        <div className="p-4">{mutuals && <div>Mutuals</div>}</div>
      </div>
      <div className="flex flex-col">
        <div>
          {follower.displayName} (
          <a
            target="_blank"
            className="underline hover:text-blue-500"
            href={`https://staging.bsky.app/profile/${follower.handle}`}
          >
            @{follower.handle}
          </a>
          )
        </div>
        <ul className="list-disc ml-6">
          <li>follows: {follower.followsCount}</li>
          <li>followers: {follower.followersCount}</li>
          <li>ratio: {ratio.toFixed(2)}</li>
          <li>posts: {follower.postsCount}</li>
        </ul>
        <div>
          <button
            className="flex justify-center m-2 p-2 border rounded-md border-gray-500"
            onClick={async (e) => {
              if (loading) {
                return;
              }
              setLoading(true);
              await (mutuals
                ? agent.deleteFollow(follower.viewer!.following!)
                : agent.follow(follower.did));
              setMutuals((mutuals) => !mutuals);
              setLoading(false);
            }}
            disabled={loading}
          >
            {loading && "Hold on"}
            {!loading && (mutuals ? "Unfollow" : "Follow")}
          </button>
        </div>
        <div>{follower.description}</div>
        <div></div>
      </div>
    </div>
  );
}
