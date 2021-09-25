<template>
  <div :id="gridItemId" :key="i" :data-gs-height="model.h" :data-gs-width="model.w"
       :data-gs-x="model.x" :data-gs-y="model.y" class="grid-stack-item relative">
    {{item.comp}}
<!--    <component :is="item.comp" :h="model.h" :height="height" :i="calcIndex" :w="model.w" :x="model.x"-->
<!--               :y="model.y">-->
<!--    </component>-->
  </div>
</template>

<script>

export default {
  name: 'griditem',
  props: ['item', 'i', 'height'],
  data() {
    return {
      model: {
        x: 0,
        y: 0,
        h: 0,
        w: 0,
        i: 0
      },
      calcIndex: null
    }
  },
  computed: {
    gridItemId() {
      return "grid-stack-item-" + this._uid
    }
  },
  methods: {
    respondToItemMove({id, item}) {
      if (this.shouldRespondToEvent(id)) {
        this.model.h = item.height
        this.model.w = item.width
        this.model.x = item.x
        this.model.y = item.y
      }
    },
    shouldRespondToEvent(id) {
      return id === this.gridItemId
    },
    reCalcIndexes(obj) {
      this.calcIndex = obj[this.gridItemId] ? obj[this.gridItemId] : 0
    }
  },
  mounted() {
    this.calcIndex = this.i
    this.$on("item-moved", this.respondToItemMove)
    this.$on("re-indexed-items", this.reCalcIndexes)
    this.model = Object.assign({}, this.item)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
</style>
