<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Popover } from '$lib/components/ui/popover';
	import PopoverContent from '$lib/components/ui/popover/popover-content.svelte';
	import PopoverTrigger from '$lib/components/ui/popover/popover-trigger.svelte';
	import ToggleGroupItem from '$lib/components/ui/toggle-group/toggle-group-item.svelte';
	import ToggleGroup from '$lib/components/ui/toggle-group/toggle-group.svelte';
	import { getDaysInMonth } from '$lib/utils';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { GripVertical } from 'lucide-svelte';
	import { Months, type Habit } from '$lib/stores';

	const months: Months[] = [
		Months.JAN,
		Months.FEB,
		Months.MAR,
		Months.APR,
		Months.MAY,
		Months.JUN,
		Months.JUL,
		Months.AUG,
		Months.SEP,
		Months.OCT,
		Months.NOV,
		Months.DEC
	];

	let currentMonth = months[new Date().getMonth()];
	const today = new Date();
	const currentYear = today.getFullYear();
	const listDate = getDaysInMonth(today.getMonth(), currentYear);
	let listHabit: Habit[] = [
		{
			id: Math.random(),
			name: 'Exercise',
			dates: [
				{
					month: Months.OCT,
					days: [1, 2, 3, 5, 8, 13, 21]
				}
			]
		},
		{
			id: Math.random(),
			name: 'Read',
			dates: [
				{
					month: Months.OCT,
					days: [1, 2, 4, 6, 7, 10, 15]
				}
			]
		},
		{
			id: Math.random(),
			name: 'Meditate',
			dates: [
				{
					month: Months.OCT,
					days: [1, 3, 5, 7, 9, 11, 13]
				}
			]
		}
	];

	const handleCheckHabit = (habitToUpdate: Habit, date: number) => {
		listHabit = listHabit.map((h) => {
			if (h.id === habitToUpdate.id) {
				const monthEntry = h.dates.find((d) => d.month === currentMonth);
				if (monthEntry) {
					if (monthEntry.days.includes(date)) {
						monthEntry.days = monthEntry.days.filter((d) => d !== date);
					} else {
						monthEntry.days.push(date);
					}
				} else {
					h.dates.push({ month: currentMonth, days: [date] });
				}
			}
			return h;
		});
	};

	const handleDndFinalize = (event: CustomEvent) => {
		console.log(event.detail.items);
		listHabit = event.detail.items;
	};
	const handleChangeHabit = (e: Event, habitToUpdate: Habit) => {
		const newName = (e.target as HTMLInputElement).value;
		listHabit = listHabit.map((h) => (h.id === habitToUpdate.id ? { ...h, name: newName } : h));
	};
</script>

<div class="m-10 font-sans text-[16px]">
	<div class="flex flex-row justify-between">
		<div class="flex flex-col items-start justify-between">
			<span class="text-[1.5em] font-bold tracking-widest">Habit Tracker</span>
			<Popover>
				<PopoverTrigger class={buttonVariants({ variant: 'default' }) + ' text-[1em]'}
					>List Habit</PopoverTrigger
				>
				<PopoverContent class="w-48" align="start">
					<div
						class="flex flex-col gap-2 overflow-scroll"
						use:dndzone={{ items: listHabit, flipDurationMs: 300 }}
						on:finalize={handleDndFinalize}
						on:consider={handleDndFinalize}
					>
						{#each listHabit as habit (habit.id)}
							<div animate:flip={{ duration: 300 }} class="flex items-center">
								<div class="cursor-grab rounded p-1 hover:bg-secondary">
									<GripVertical class="h-5 w-5 text-muted-foreground" />
								</div>
								<Input
									id="width"
									value={habit.name}
									size={10}
									class="col-span-2 h-8"
									onchange={(e) => handleChangeHabit(e, habit)}
								/>
							</div>
						{/each}

						<div class="flex items-center justify-center">
							<button
								class={buttonVariants({ variant: 'outline' }) +
									' w-full text-[1em] hover:bg-primary-foreground'}
								on:click={() =>
									(listHabit = [...listHabit, { id: Math.random(), name: 'New Habit', dates: [] }])}
							>
								Add Habit
							</button>
						</div>
					</div></PopoverContent
				>
			</Popover>
		</div>
		<div>{currentMonth}</div>

		<div class="flex flex-col rounded ring-2 ring-primary-foreground">
			<span class="bg-primary-foreground py-1 text-center text-[1.25em] font-bold">Month</span>
			<ToggleGroup type="multiple">
				<ToggleGroup
					type="single"
					bind:value={currentMonth}
					variant="outline"
					class="flex flex-col"
				>
					<div>
						{#each [...months.slice(0, 6)] as month}
							<ToggleGroupItem
								class="h-12 w-14 cursor-pointer text-[1em] font-medium focus-within:bg-accent-foreground"
								value={month}
								aria-label={`Select ${month}`}
							>
								{month}
							</ToggleGroupItem>
						{/each}
					</div>
					<div>
						{#each [...months.slice(6)] as month}
							<ToggleGroupItem
								class="h-12 w-14 cursor-pointer text-[1em] font-medium focus-within:bg-accent-foreground"
								value={month}
								aria-label={`Select ${month}`}
							>
								{month}
							</ToggleGroupItem>
						{/each}
					</div>
				</ToggleGroup>
			</ToggleGroup>
		</div>
	</div>

	<div class="my-5 overflow-x-auto ring-2 ring-primary-foreground">
		<div
			class="grid items-center justify-between divide-x-2"
			style="grid-template-columns: 200px repeat({listDate.length}, 60px);"
		>
			<span class="sticky left-0 border-r-2 border-b-2 bg-background p-2 font-bold">Habits</span>
			{#each listDate as date}
				<span class="border-b-2 bg-primary-foreground p-2 text-center font-bold">{date}</span>
			{/each}

			{#each listHabit as habit (habit.id)}
				<span class="sticky left-0 border-r-2 border-b-2 bg-background p-2">{habit.name}</span>
				{#each listDate as date}
					<div class="flex items-center justify-center p-2">
						<Checkbox
							checked={habit.dates.find((d) => d.month === currentMonth)?.days.includes(date)}
							on:click={() => handleCheckHabit(habit, date)}
						/>
					</div>
				{/each}
			{/each}
		</div>
	</div>
</div>
