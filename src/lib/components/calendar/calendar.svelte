<script lang="ts">
	import { addWeeks, subWeeks, startOfWeek, addDays, format, isSameDay } from 'date-fns';
	import { fly } from 'svelte/transition'; // use fly for x/y translation
	import { cubicOut } from 'svelte/easing'; // <-- BARU: Impor easing const
	import { Dialog, DialogContent } from '../ui/dialog';

	// --- 1. DATA (Sama seperti sebelumnya) ---
	const allEvents = [
		// ... (data acaramu tidak berubah) ...
		{
			id: 'e1',
			title: 'Morning bike ride',
			calendarId: 'c1',
			date: '2025-04-01',
			startHour: 8,
			durationHours: 1
		},
		{
			id: 'e2',
			title: 'Artist workshop',
			calendarId: 'c4',
			date: '2025-04-01',
			startHour: 9,
			durationHours: 2
		},
		{
			id: 'e3',
			title: 'Meet Orkun',
			calendarId: 'c2',
			date: '2025-04-02',
			startHour: 8.5,
			durationHours: 1
		},
		{
			id: 'e4',
			title: 'Portfolio work',
			calendarId: 'c2',
			date: '2025-04-02',
			startHour: 10,
			durationHours: 1.5
		},
		{
			id: 'e5',
			title: 'Stretching',
			calendarId: 'c1',
			date: '2025-04-03',
			startHour: 11,
			durationHours: 1
		},
		{
			id: 'e6',
			title: 'Budget meeting',
			calendarId: 'c3',
			date: '2025-04-04',
			startHour: 11,
			durationHours: 1
		},
		{
			id: 'e7',
			title: 'Soccer practice',
			calendarId: 'c4',
			date: '2025-04-05',
			startHour: 16,
			durationHours: 1.5
		},
		{
			id: 'e8',
			title: 'Hike with Rigo',
			calendarId: 'c3',
			date: '2025-04-06',
			startHour: 9,
			durationHours: 3
		}
	];

	const calendars = [
		{ id: 'c1', name: 'Personal', color: '#ef4444' },
		{ id: 'c2', name: 'Work', color: '#3b82f6' },
		{ id: 'c3', name: 'Family', color: '#22c55e' },
		{ id: 'c4', name: 'School', color: '#eab308' }
	];

	// --- 2. STATE ---

	let currentDate = new Date('2025-04-01T00:00:00');
	const timeSlots = Array.from({ length: 24 }, (_, i) => i);
	let visibleCalendarIds = calendars.map((cal) => cal.id);

	// <-- BARU: State untuk melacak arah animasi -->
	let animationDirection: 'next' | 'prev' = 'next';

	// --- 3. REAKTIVITAS (Sama seperti sebelumnya) ---

	$: displayedWeek = (() => {
		const start = startOfWeek(currentDate, { weekStartsOn: 0 });
		return Array.from({ length: 7 }, (_, i) => addDays(start, i));
	})();

	$: displayedMonth = format(currentDate, 'MMMM yyyy');

	$: filteredEvents = allEvents.filter((event) => visibleCalendarIds.includes(event.calendarId));

	// --- 4. HELPER constS ---

	const getCalendar = (calendarId: string) => {
		return calendars.find((cal) => cal.id === calendarId);
	};

	const getEventsForDay = (date: Date) => {
		return filteredEvents.filter((event) => isSameDay(new Date(event.date), date));
	};

	const calculatePosition = (event: { startHour: number; durationHours: number }) => {
		const START_HOUR = 0;
		const TOTAL_HOURS = 24;
		const topPercent = ((event.startHour - START_HOUR) / TOTAL_HOURS) * 100;
		const heightPercent = (event.durationHours / TOTAL_HOURS) * 100;
		return `top: ${topPercent}%; height: ${heightPercent}%;`;
	};

	// <-- BARU: Fungsi navigasi diupdate untuk mengatur arah -->
	const goToNextWeek = () => {
		animationDirection = 'next'; // Set arah
		currentDate = addWeeks(currentDate, 1);
	};

	const goToPrevWeek = () => {
		animationDirection = 'prev'; // Set arah
		currentDate = subWeeks(currentDate, 1);
	};

	const goToToday = () => {
		const today = new Date();
		if (isSameDay(currentDate, today)) return; // Sudah di hari ini

		// Cek apakah 'today' ada di minggu yang sedang ditampilkan
		const isTodayInCurrentWeek = displayedWeek.some((day) => isSameDay(day, today));

		if (isTodayInCurrentWeek) {
			// Jika ya, cukup update currentDate. Tidak perlu animasi.
			currentDate = today;
		} else {
			// Jika tidak, kita perlu pindah minggu DAN animasi.
			animationDirection = today > currentDate ? 'next' : 'prev';
			currentDate = today;
		}
	};

	const handleClickHour = (hour: number, day: Date) => {
		alert(`Clicked on ${format(day, 'yyyy-MM-dd')} at ${hour}:00`);
	};

	const handleKeyDownHour = (event: KeyboardEvent, hour: number, day: Date) => {
		// Jika tombol yang ditekan adalah Spasi atau Enter
		if (event.key === ' ' || event.key === 'Enter') {
			// Cegah aksi default (misalnya spasi men-scroll halaman)
			event.preventDefault();
			// Panggil fungsi klik yang sama
			handleClickHour(hour, day);
		}
	};
</script>

<div class="flex h-screen bg-white text-gray-800">
	<div class="w-64 flex-shrink-0 border-r p-4">
		<h2 class="mb-4 text-xl font-bold">Calendars</h2>
		<div class="space-y-2">
			{#each calendars as calendar}
				<label class="flex cursor-pointer items-center space-x-2">
					<input
						type="checkbox"
						bind:group={visibleCalendarIds}
						value={calendar.id}
						class="form-checkbox rounded"
						style="color: {calendar.color};"
					/>
					<span class="h-3 w-3 rounded-full" style="background-color: {calendar.color};"></span>
					<span>{calendar.name}</span>
				</label>
			{/each}
		</div>
	</div>

	<div class="flex flex-1 flex-col">
		<div class="flex items-center justify-between border-b p-2">
			<h2 class="text-2xl font-bold text-gray-700">{displayedMonth}</h2>
			<div class="flex space-x-2">
				<button on:click={goToPrevWeek} class="rounded bg-gray-100 px-3 py-1 hover:bg-gray-200">
					&lt; Prev
				</button>
				<button on:click={goToToday} class="rounded bg-gray-100 px-3 py-1 hover:bg-gray-200">
					Today
				</button>
				<button on:click={goToNextWeek} class="rounded bg-gray-100 px-3 py-1 hover:bg-gray-200">
					Next &gt;
				</button>
			</div>
		</div>

		<div class="flex border-b">
			<div class="w-20 flex-shrink-0"></div>
			{#each displayedWeek as day}
				<div class="flex-1 p-2 text-center font-medium">
					{format(day, 'E d')}
				</div>
			{/each}
		</div>

		<div class="flex flex-1 overflow-y-auto">
			<div class="w-20 flex-shrink-0">
				{#each timeSlots as hour}
					<div class="-mt-2 h-12 pr-2 text-right text-sm text-gray-500">
						{#if hour === 0}
							12 AM
						{:else if hour < 12}
							{hour} AM
						{:else if hour === 12}
							12 PM
						{:else}
							{hour - 11} PM
						{/if}
					</div>
				{/each}
			</div>

			<div class="relative flex-1 overflow-hidden">
				{#key displayedWeek[0]}
					<div
						class="absolute inset-0 grid grid-cols-7"
						in:fly={{
							duration: 250,
							easing: cubicOut,
							x: animationDirection === 'next' ? 300 : -300
						}}
						out:fly={{
							duration: 250,
							easing: cubicOut,
							x: animationDirection === 'next' ? -300 : 300
						}}
					>
						{#each displayedWeek as day}
							<div class="relative border-l border-gray-200">
								{#each timeSlots as hour}
									<div
										tabindex="0"
										role="button"
										on:keydown={(e) => handleKeyDownHour(e, hour, day)}
										on:click={() => handleClickHour(hour, day)}
										class="h-12 border-b border-gray-100 hover:cursor-pointer hover:bg-accent"
									></div>
								{/each}

								{#each getEventsForDay(day) as event}
									{@const cal = getCalendar(event.calendarId)}
									<div
										class="absolute left-1 w-11/12 rounded p-1 text-sm text-black"
										style="{calculatePosition(
											event
										)} background-color: {cal?.color}B3; border-left: 3px solid {cal?.color};"
									>
										<div class="font-semibold">{event.title}</div>
									</div>
								{/each}
							</div>
						{/each}
					</div>
				{/key}
			</div>
		</div>
	</div>
</div>

<Dialog open={true}>
	<DialogContent>Test</DialogContent>
</Dialog>
