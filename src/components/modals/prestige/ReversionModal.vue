<script>
import ResetModal from "@/components/modals/prestige/ResetModal";

export default {
  name: "ReversionModal",
  components: {
    ResetModal,
  },
  data() {
    return {
      gainedTimeCapsules: new Decimal(),
      gainedReversions: 0,
    };
  },
  computed: {
    message() {
      return `Upon Reverting, everything pre-Reversion will be reset.`;
    },
    gainedResources() {
      return `You will gain ${quantify("Reversion", this.gainedReversions, 2, 0)} and ${quantify("Time Capsule", this.gainedCapsules, 2, 0)}.`;
    },
    startingResources() {
      return `You will start your next Reversion with nothing.`;
    },
  },
  methods: {
    update() {
      this.gainedTimeCapsules = gainedTimeCapsules();
      this.gainedReversions = getReversionGain();
    },
    handleYesClick() {
      revert();
      EventHub.ui.offAll(this);
    },
  },
};
</script>

<template>
  <ResetModal
    header="You are about to Revert"
    :message="message"
    :gained-resources="gainedResources"
    :starting-resources="startingResources"
    :confirm-fn="handleYesClick"
    confirm-option="reversion"
  />
</template>