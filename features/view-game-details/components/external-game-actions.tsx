import {
  AddToCollectionModal,
  // AddToWishlistFromExternalPage,
} from "@/features/add-game";

type ExternalGameActionsProps = {
  igdbId: number;
  isWishlistDisabled: boolean;
  gameTitle: string;
};

export const ExternalGameActions = ({
  igdbId,
  gameTitle,
}: ExternalGameActionsProps) => {
  return (
    <div className="flex flex-col gap-2">
      {/* <AddToWishlistFromExternalPage
        igdbId={igdbId}
        isWishlistDisabled={isWishlistDisabled}
      /> */}
      <AddToCollectionModal gameTitle={gameTitle} igdbId={igdbId} />
    </div>
  );
};
