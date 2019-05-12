<script>
    export let name;
    export let styles;
    export let disabled = true;
    export let count = 0;
    export let size = 'm';
    export let color = 'red';
</script>

<style reshadow>
    button {
        color: val(color);
    }

    button[disabled] {
        opacity: 0.5;
    }
</style>

<button {disabled}>hello {name}</button>
