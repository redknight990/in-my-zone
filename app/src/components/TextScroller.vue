<template>
    <div class="text-container">
        <marquee-text :duration="duration" v-if="overflow">
            <div class="mr-16">
                <slot></slot>
            </div>
        </marquee-text>
        <div ref="content" v-else>
            <slot></slot>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'TextScroller',
        props: {
            duration: {
                type: Number,
                default: 8
            }
        },
        data() {
            return {
                overflow: false
            };
        },
        mounted() {
            this.update();
        },
        methods: {
            update() {
                this.overflow = false;
                this.$nextTick(() => {
                    let el = this.$refs.content;
                    if (!el)
                        return;
                    this.overflow = Math.abs(el.offsetWidth - el.scrollWidth) >= 2;
                });
            }
        }
    }
</script>

<style lang="scss" scoped>
    .text-container {
        width: 100%;
        overflow-x: hidden;
        white-space: nowrap;
    }
</style>
