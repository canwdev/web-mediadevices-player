<script lang="ts" setup="">
import {toRefs} from 'vue'

const props = withDefaults(
  defineProps<{
    docked?: boolean
  }>(),
  {
    docked: true,
  },
)
const emit = defineEmits([])
const {docked} = toRefs(props)
</script>

<template>
  <div class="darg-button-wrapper">
    <button :class="{docked}" class="btn-no-style btn-action-bar-drag">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M16,12A2,2 0 0,1 18,10A2,2 0 0,1 20,12A2,2 0 0,1 18,14A2,2 0 0,1 16,12M10,12A2,2 0 0,1 12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12M4,12A2,2 0 0,1 6,10A2,2 0 0,1 8,12A2,2 0 0,1 6,14A2,2 0 0,1 4,12Z"
        />
      </svg>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.darg-button-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
}
.btn-action-bar-drag {
  font-size: 12px;
  z-index: 100;
  pointer-events: auto;
  background-color: transparent;
  padding: 4px 10px;
  line-height: 1;
  color: white;

  transition: all 0.3s;
  transform: translateY(15px);
  border-radius: var(--radius);
  //opacity: 0;

  &::before {
    left: -80% !important;
    opacity: 0 !important;
  }
  &::after {
    right: -80% !important;
    opacity: 0 !important;
  }

  &.docked {
    opacity: 1;
    transform: translateY(0px);
    border-radius: 0 0 var(--radius) var(--radius);
    background-color: var(--bg);
    &::before {
      left: -100% !important;
      opacity: 1 !important;
    }
    &::after {
      right: -100% !important;
      opacity: 1 !important;
    }
  }

  &:active {
    svg {
      transform: scale(0.95);
    }
  }

  svg {
    width: 12px;
    transform: scale(1.5);
    transition: all 0.3s;
  }

  &::before,
  &::after {
    content: ' ';
    pointer-events: none;
    position: absolute;
    display: block;
    height: 60%;
    width: 100%;
    top: 0;
    z-index: -1;
    opacity: 1;
    //outline: 1px solid red;
    border-radius: 0;
    transition: all 0.3s;
  }

  &::before {
    left: -100%;
    border-top-right-radius: var(--radius);
    box-shadow: var(--radius) 0 0 0 var(--bg);
  }

  &::after {
    right: -100%;
    border-top-left-radius: var(--radius);
    box-shadow: calc(var(--radius) * -1) 0 0 0px var(--bg);
  }
}
</style>
